import { Link } from "react-router-dom";
import { PolicyPageLayout } from "../features/policies/PolicyPageLayout";
import { officeEmail, officeEmailHref } from "../config/officeContact";

export function PrivacyNoticePage() {
  return <PolicyPageLayout title="Privacy Notice">
    <section><h2>About this notice</h2>
      <p>This notice applies to public use of the CPSU Planning and Development Office Information Hub. You can browse its public information, reports, and available document previews without creating an account.</p>
      <p>For questions about your privacy on this website, email <a href={officeEmailHref}>{officeEmail}</a>.</p>
    </section>
    <section><h2>Information involved when you visit</h2>
      <p>Basic visit information, such as the pages you request and the browser you use, may be recorded to keep the website working and protect it from misuse.</p>
      <p>Search and filter choices may appear in the page address. Please avoid entering private or sensitive information into the search field.</p>
      <p>If you email the office, your email address, message, and any details you choose to include will be used to respond to your inquiry or concern.</p>
    </section>
    <section><h2>How your information is used</h2>
      <p>Information is used to provide access to public resources, address website problems, maintain a safe service, and respond to messages. This website does not include advertising trackers.</p>
      <p>Your inquiry may be shared with the appropriate office personnel when needed to handle your request. Services that help operate the website may also handle basic visit information for this purpose.</p>
    </section>
    <section><h2>Keeping information safe</h2>
      <p>Access to information that is not intended for the public is restricted. Please share only the details necessary for your inquiry and avoid sending sensitive records in your first message.</p>
      <p>Information is kept for as long as needed for its purpose and any applicable recordkeeping requirements. Contact the office to ask how long information relating to your inquiry is kept.</p>
    </section>
    <section><h2>Your privacy requests</h2>
      <p>You may ask about the use of your personal information, request access or a correction, or raise a concern about information shown on this website. Requests to remove information or stop its use will be considered in accordance with applicable law and recordkeeping requirements.</p>
      <p>Use <Link to="/report-a-concern">Report a Concern</Link> or email the office with a brief explanation and the relevant page or resource. Avoid sending unnecessary identity documents. The office may ask for additional details when needed to handle your request.</p>
    </section>
    <section><h2>Links to other websites</h2>
      <p>Some resources may lead to another website. This notice applies only to this Information Hub. Check the privacy information on another website before sharing your personal details there.</p>
    </section>
    <section><h2>Updates to this notice</h2>
      <p>This notice may be updated when the website or the way information is handled changes. The last updated date appears at the top of this page.</p>
    </section>
  </PolicyPageLayout>;
}
