import { installPromiseWithResolversPolyfill } from "../../utils/promiseWithResolvers";

installPromiseWithResolversPolyfill();
void import("pdfjs-dist/legacy/build/pdf.worker.min.mjs");