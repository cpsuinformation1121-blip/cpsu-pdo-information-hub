import { Link } from "react-router-dom";
import { PolicyPageLayout } from "../features/policies/PolicyPageLayout";
import { officeEmail, officeEmailHref } from "../config/officeContact";
const topics = [
  { title: "Privacy concern", description: "Personal information appears exposed, or you have a question about how your information is handled." },
  { title: "Information correction", description: "A statistic, reporting year, resource name, or document appears incorrect or outdated." },
  { title: "Copyright concern", description: "You believe a resource has been used without appropriate permission or attribution." },
  { title: "Website concern", description: "A page or resource is not working, or you noticed something that may affect the safe use of the website." },
] as const;
export function ReportConcernPage() {
  return <PolicyPageLayout title="Report a Concern" description="Help the office identify an information error, privacy issue, copyright concern, or website problem.">
    <section><h2>Contact the Planning and Development Office</h2>
      <p>Email <a href={officeEmailHref}>{officeEmail}</a> with the relevant page address, resource title or reporting year, and a short explanation.</p>
      <p>The links below open your email application with a subject. Nothing is submitted through this page; review your message and send it from your email application.</p>
      <ul className="mt-5 !list-none !space-y-3 !pl-0">
        {topics.map(topic => <li key={topic.title} className="rounded-xl border border-border p-4">
          <a href={officeEmailHref + "?subject=" + encodeURIComponent("Information Hub - " + topic.title)} className="inline-flex min-h-11 items-center">{topic.title}</a>
          <p>{topic.description}</p>
        </li>)}
      </ul>
    </section>
    <section><h2>Share only what is necessary</h2>
      <p>Share only the details needed to explain your concern. Avoid sending complete personal records or unnecessary identity documents. If a screenshot is useful, conceal unrelated personal information. Contact the office first if supporting information is sensitive.</p>
      <p>For copyright concerns, identify the work, your relationship to the rights holder, the affected resource, and the issue you would like reviewed. Avoid sending identity documents in your initial message.</p>
    </section>
    <section><h2>Reporting a website problem</h2>
      <p>Describe the page you visited and what happened. If information appears to have been shared by mistake, notify the office without copying or sharing it further.</p>
    </section>
    <section><h2>Other ways to reach the office</h2>
      <p>If an email application is unavailable, copy the address above into your preferred email service or use the existing details on the <Link to="/contact">Contact page</Link>. Read the <Link to="/privacy-notice">Privacy Notice</Link> for information about inquiries and personal data.</p>
    </section>
  </PolicyPageLayout>;
}
