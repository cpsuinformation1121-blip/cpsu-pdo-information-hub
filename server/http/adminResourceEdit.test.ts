import { CopyObjectCommand, DeleteObjectCommand, HeadObjectCommand, PutObjectCommand, type GetObjectCommand } from "@aws-sdk/client-s3";
import type { DecodedIdToken } from "firebase-admin/auth";
import { describe, expect, it, vi, type Mock } from "vitest";
import { resourceQuerySchema } from "../../src/contracts/resource";
import { resourceEditSchema } from "../../src/contracts/adminOperations";
import { handleAdminResourceMutationRequest } from "./adminResourceMutationHandler";
import { findResourceByPublicId, listAdminResources, listResources } from "../repository/listResources";
import { handlePublicResourcePreviewRequest } from "./publicResourcePreviewHandler";
import { handlePublicResourceLinkRequest } from "./publicResourceLinkHandler";

const config = {
  accountId: "account", accessKeyId: "key", secretAccessKey: "secret",
  bucketName: "repository", endpoint: "https://account.r2.cloudflarestorage.com",
};
const identity = { uid: "admin", admin: true } as unknown as DecodedIdToken;
const structure = [
  { id: "source", title: "Source", categories: [{ id: "original", title: "Original" }] },
  { id: "destination", title: "Destination", categories: [{ id: "reports", title: "Reports" }] },
];
const key = "source/original/nested/2026/report.pdf";
const values = { key, displayName: "CPSU \u2014 \u5e74\u5ea6 report_name", sectionId: "destination", categoryId: "reports", year: "2027-2028" };
function request(input: unknown = values, authenticated = true) {
  return new Request("http://localhost/api/admin/resource", {
    method: "PATCH",
    headers: { "content-type": "application/json", ...(authenticated ? { authorization: "Bearer valid" } : {}) },
    body: JSON.stringify({ action: "edit", ...(input as object) }),
  });
}
const source = {
  ETag: '"original"', Metadata: { existing: "retained" } as Record<string, string>,
  ContentType: "application/pdf", CacheControl: "private, no-store",
  ContentDisposition: "inline", ContentLength: 1024, LastModified: new Date("2026-09-01T00:00:00Z"),
};
function dependencies(send: Mock<(command: unknown) => Promise<unknown>> = vi.fn(async (command: unknown) => {
  if (command instanceof HeadObjectCommand && command.input.Key !== key) throw { $metadata: { httpStatusCode: 404 } };
  return source;
})) {
  return { config, structure, send, verifyIdToken: async () => identity, audit: vi.fn(async () => "audit") };
}

describe("resource metadata editing", () => {
  it("requires authentication before accessing repository storage", async () => {
    const deps = dependencies();
    expect((await handleAdminResourceMutationRequest(request(values, false), deps)).status).toBe(401);
    expect(deps.send).not.toHaveBeenCalled();
  });
  it("rejects users without administrator permission", async () => {
    const deps = dependencies();
    const response = await handleAdminResourceMutationRequest(request(), {
      ...deps, verifyIdToken: async () => ({ uid: "guest" }) as DecodedIdToken,
    });
    expect(response.status).toBe(403);
    expect(deps.send).not.toHaveBeenCalled();
  });
  it.each([
    { displayName: "" }, { displayName: "bad\u0000name" }, { year: "2026-2029" },
    { year: 1800 }, { sectionId: "../unsafe" }, { sectionId: "missing" }, { categoryId: "original" },
    { key: "../../private.pdf" },
  ])("rejects invalid edits before accessing objects: %j", async (change) => {
    const deps = dependencies();
    const response = await handleAdminResourceMutationRequest(request({ ...values, ...change }), deps);
    expect(response.status).toBe(400);
    expect(deps.send).not.toHaveBeenCalled();
  });
  it("copies the original with exact display metadata, preserves properties, and deletes only after copy succeeds", async () => {
    const deps = dependencies();
    const response = await handleAdminResourceMutationRequest(request(), deps);
    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("private, no-store");
    await expect(response.json()).resolves.toEqual({ data: { key: "destination/reports/2027-2028/report.pdf" } });
    const commands = deps.send.mock.calls.map(([command]) => command);
    expect(commands).toHaveLength(4);
    expect(commands[0]).toBeInstanceOf(HeadObjectCommand);
    expect(commands[1]).toBeInstanceOf(HeadObjectCommand);
    expect(commands[2]).toBeInstanceOf(CopyObjectCommand);
    expect(commands[3]).toBeInstanceOf(DeleteObjectCommand);
    const copy = commands[2] as CopyObjectCommand;
    expect(copy.input).toMatchObject({
      Key: "destination/reports/2027-2028/report.pdf", CopySource: "repository/" + key,
      CopySourceIfMatch: source.ETag, MetadataDirective: "REPLACE",
      Metadata: { existing: "retained", "display-name": encodeURIComponent(values.displayName) },
      ContentType: source.ContentType, CacheControl: source.CacheControl, ContentDisposition: source.ContentDisposition,
    });
    // Verify that the R2 create-only destination condition is attached to moved copies.
    const resolve = copy.middlewareStack.resolve(async (args) => {
      expect((args.request as { headers: Record<string, string> }).headers["cf-copy-destination-if-none-match"]).toBe("*");
      return { response: {}, output: { $metadata: {} } };
    }, {});
    await resolve({ input: copy.input, request: { headers: {} } } as never);
    expect(deps.audit).toHaveBeenCalledWith(expect.objectContaining({ action: "resource.updated", target: key }), undefined);
    expect(commands.some((command) => command instanceof PutObjectCommand)).toBe(false);
  });
  it("edits only the display name in place without checking duplicates or deleting the original", async () => {
    const deps = dependencies();
    const response = await handleAdminResourceMutationRequest(request({
      ...values, sectionId: "source", categoryId: "original", year: 2026,
    }), deps);
    expect(response.status).toBe(200);
    const commands = deps.send.mock.calls.map(([command]) => command);
    expect(commands).toHaveLength(2);
    expect((commands[1] as CopyObjectCommand).input.Key).toBe(key);
    expect(commands.some((command) => command instanceof DeleteObjectCommand)).toBe(false);
  });
  it("preserves nested categories when changing only the year", async () => {
    const deps = dependencies();
    const response = await handleAdminResourceMutationRequest(request({
      ...values, sectionId: "source", categoryId: "original", year: 2027,
    }), deps);
    await expect(response.json()).resolves.toEqual({ data: { key: "source/original/nested/2027/report.pdf" } });
  });
  it("supports removing a category", async () => {
    const deps = dependencies();
    const response = await handleAdminResourceMutationRequest(request({ ...values, categoryId: undefined }), deps);
    await expect(response.json()).resolves.toEqual({ data: { key: "destination/2027-2028/report.pdf" } });
  });
  it("rejects existing destinations without copying or deleting", async () => {
    const deps = dependencies(vi.fn(async () => source));
    const response = await handleAdminResourceMutationRequest(request(), deps);
    expect(response.status).toBe(409);
    expect(deps.send.mock.calls.every(([command]) => command instanceof HeadObjectCommand)).toBe(true);
  });
  it.each([412, 500])("leaves the source intact when copying fails with %s", async (status) => {
    const deps = dependencies(vi.fn(async (command: unknown) => {
      if (command instanceof CopyObjectCommand) throw { $metadata: { httpStatusCode: status } };
      if (command instanceof HeadObjectCommand && command.input.Key !== key) throw { $metadata: { httpStatusCode: 404 } };
      return source;
    }));
    const response = await handleAdminResourceMutationRequest(request(), deps);
    expect(response.status).toBe(status === 412 ? 409 : 500);
    expect(deps.send.mock.calls.some(([command]) => command instanceof DeleteObjectCommand)).toBe(false);
  });
  it("returns a safe not-found response for a missing source", async () => {
    const deps = dependencies(vi.fn(async () => { throw { $metadata: { httpStatusCode: 404 } }; }));
    expect((await handleAdminResourceMutationRequest(request(), deps)).status).toBe(404);
    expect(deps.send).toHaveBeenCalledTimes(1);
  });
  it("does not mutate storage when the audit write fails", async () => {
    const deps = dependencies();
    const response = await handleAdminResourceMutationRequest(request(), {
      ...deps, audit: async () => { throw Error("audit unavailable"); },
    });
    expect(response.status).toBe(500);
    expect(deps.send.mock.calls.every(([command]) => command instanceof HeadObjectCommand)).toBe(true);
  });
  it.each(["pdf", "png", "xlsx", "link"])("preserves %s contents and exposes edited metadata through existing access paths", async (extension) => {
    const oldKey = `source/original/2026/resource.${extension}`;
    const objects = new Map([[oldKey, { ...source, body: extension === "link" ? JSON.stringify({ url: "https://example.edu/form" }) : "original file bytes" }]]);
    const deps = dependencies(vi.fn(async (command: unknown) => {
      if (command instanceof HeadObjectCommand) {
        const object = objects.get(command.input.Key!);
        if (!object) throw { $metadata: { httpStatusCode: 404 } };
        return object;
      }
      if (command instanceof CopyObjectCommand) {
        const old = objects.get(decodeURIComponent(command.input.CopySource!.slice("repository/".length)))!;
        objects.set(command.input.Key!, { ...old, Metadata: command.input.Metadata! });
      }
      if (command instanceof DeleteObjectCommand) objects.delete(command.input.Key!);
      return {};
    }));
    const response = await handleAdminResourceMutationRequest(request({ ...values, key: oldKey }), deps);
    expect(response.status).toBe(200);
    const newKey = `destination/reports/2027-2028/resource.${extension}`;
    expect(objects.get(newKey)?.body).toBe(extension === "link" ? JSON.stringify({ url: "https://example.edu/form" }) : "original file bytes");
    expect(objects.has(oldKey)).toBe(false);
    const listingDependencies = {
      config, structure,
      listObjects: async () => ({ Contents: [...objects].map(([Key, object]) => ({ Key, Size: object.ContentLength, LastModified: object.LastModified })) }),
      headObject: async (_bucket: string, objectKey: string) => objects.get(objectKey)!,
    };
    const query = resourceQuerySchema.parse({ q: "\u5e74\u5ea6", section: "destination", year: "2027-2028", sort: "name-asc" });
    const publicList = await listResources(query, listingDependencies);
    const adminList = await listAdminResources(query, listingDependencies);
    expect(publicList.data).toHaveLength(1);
    expect(publicList.data[0]).toMatchObject({ displayName: values.displayName, sectionId: "destination", categoryId: "reports", year: "2027-2028" });
    expect(publicList.data[0]).not.toHaveProperty("key");
    expect(publicList.data[0]).not.toHaveProperty("Metadata");
    expect(adminList.data[0].key).toBe(newKey);
    const findResource = (id: string) => findResourceByPublicId(id, listingDependencies);
    expect(await findResource(publicList.data[0].id)).toMatchObject({ key: newKey, displayName: values.displayName });
    if (extension === "link") {
      const opened = await handlePublicResourceLinkRequest(new Request(`http://localhost/api/resource-link?id=${publicList.data[0].id}`), {
        config, findResource, readLink: async () => objects.get(newKey)!.body,
      });
      expect(opened.status).toBe(302);
      expect(opened.headers.get("location")).toBe("https://example.edu/form");
    } else {
      const sign = vi.fn(async (command: GetObjectCommand) => {
        expect(command.input.Key).toBe(newKey);
        return "https://signed.example/preview";
      });
      const preview = await handlePublicResourcePreviewRequest(new Request("http://localhost/api/resource-preview", {
        method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ id: publicList.data[0].id }),
      }), { config, findResource, sign });
      expect(preview.status).toBe(extension === "xlsx" ? 400 : 200);
      expect(sign).toHaveBeenCalledTimes(extension === "xlsx" ? 0 : 1);
    }
  });
  it("keeps display names independent of storage filenames", () => {
    expect(resourceEditSchema.parse({ ...values, displayName: "  A / B: 100% complete  " }).displayName).toBe("A / B: 100% complete");
  });
});
