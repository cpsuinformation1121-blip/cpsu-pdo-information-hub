import { Link } from "react-router-dom";
import { PolicyPageLayout } from "../features/policies/PolicyPageLayout";

export function TermsOfUsePage() {
  return <PolicyPageLayout title="Terms of Use">
    <section><h2>Purpose of this website</h2>
      <p>The CPSU Planning and Development Office Information Hub provides public information, reports, statistics, and available document previews. These terms apply to your use of this website.</p>
    </section>
    <section><h2>Understanding the information</h2>
      <p>Check the title, reporting year, and context of a resource before referring to it. Reports from different years may describe different circumstances, and information may be updated or corrected.</p>
      <p>For current figures, certified records, or information needed for an official decision, <Link to="/contact">contact the office</Link> for confirmation.</p>
    </section>
    <section><h2>Using and citing resources</h2>
      <p>When referring to a resource, identify its title, reporting year, source office where stated, and the date you accessed it. Preserve the meaning and context of the information.</p>
      <p>Documents, photographs, and other materials may have their own conditions for use. Being available to view does not automatically give permission to republish or use every item commercially. Follow any notice accompanying the resource and ask the office if permission is unclear.</p>
      <p>Do not present altered information as an official statement or imply endorsement of your own work. Giving credit does not replace permission when permission is required.</p>
    </section>
    <section><h2>Responsible use</h2>
      <ul><li>Use the website respectfully and avoid actions that interrupt access for others.</li><li>Do not alter resources or attempt to access information that is not available to the public.</li><li>Respect the privacy of people whose information appears in a resource.</li><li>Report incorrect information, privacy issues, or concerns about the use of a resource.</li></ul>
    </section>
    <section><h2>Other websites and availability</h2>
      <p>Some resources may open another website. Its content and terms are the responsibility of its operator. Check the destination before sharing personal information.</p>
      <p>This Information Hub may be temporarily unavailable during maintenance or an interruption. Contact the office if you cannot access a resource you need.</p>
    </section>
    <section><h2>Questions and concerns</h2>
      <p>Use <Link to="/report-a-concern">Report a Concern</Link> to request a correction or raise a privacy, copyright, or website concern. Include the relevant page or resource and a brief explanation.</p>
      <p>These terms do not remove rights available under applicable law. Read the <Link to="/privacy-notice">Privacy Notice</Link> for information about browsing and contacting the office.</p>
    </section>
  </PolicyPageLayout>;
}
