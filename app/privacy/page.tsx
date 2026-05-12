export const metadata = {
  title: "Privacy Policy | Messenger AI Chatbot",
  description: "Privacy Policy for the Messenger AI chatbot.",
};

const sections = [
  {
    title: "Information We May Collect",
    body:
      "We may collect Messenger messages you send to the chatbot, conversation history, and phone numbers you choose to provide for contact purposes.",
  },
  {
    title: "How We Use Data",
    body:
      "Data is used for customer support, marketing consultation, stream collaboration, product or service recommendations, and service inquiries.",
  },
  {
    title: "Conversation History",
    body:
      "We may store conversation history to understand your request, improve follow-up, prevent duplicate responses, and help a human admin continue the conversation when needed.",
  },
  {
    title: "Phone Numbers",
    body:
      "If you provide a phone number, we may use it to contact you about stream services, marketing services, price quotes, collaboration, or related inquiries.",
  },
  {
    title: "Data Deletion",
    body:
      "You may request deletion of your data at any time by contacting us. We will review and process reasonable deletion requests.",
  },
];

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-[#07090f] px-5 py-10 text-slate-100 sm:px-6 lg:px-8">
      <section className="mx-auto flex min-h-[calc(100vh-5rem)] w-full max-w-3xl flex-col justify-center">
        <div className="mb-10">
          <p className="mb-4 text-sm font-medium uppercase tracking-[0.22em] text-cyan-300">
            Messenger AI Chatbot
          </p>
          <h1 className="text-4xl font-semibold tracking-normal text-white sm:text-5xl">
            Privacy Policy
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-slate-300">
            This page explains how we handle information shared through our
            Messenger AI chatbot for stream, marketing, collaboration, and
            service inquiries.
          </p>
        </div>

        <div className="mb-8 rounded-lg border border-white/10 bg-white/[0.04] p-5">
          <p className="text-sm text-slate-400">Last updated</p>
          <p className="mt-1 text-base font-medium text-white">May 12, 2026</p>
        </div>

        <div className="space-y-4">
          {sections.map((section) => (
            <article
              key={section.title}
              className="rounded-lg border border-white/10 bg-white/[0.035] p-5 shadow-[0_24px_80px_rgba(0,0,0,0.25)]"
            >
              <h2 className="text-lg font-semibold tracking-normal text-white">
                {section.title}
              </h2>
              <p className="mt-3 text-sm leading-6 text-slate-300 sm:text-base">
                {section.body}
              </p>
            </article>
          ))}
        </div>

        <div className="mt-8 rounded-lg border border-cyan-300/20 bg-cyan-300/[0.06] p-5">
          <h2 className="text-lg font-semibold text-white">Contact</h2>
          <p className="mt-3 text-sm leading-6 text-slate-300 sm:text-base">
            For privacy questions or data deletion requests, contact us at{" "}
            <a
              className="font-medium text-cyan-300 hover:text-cyan-200"
              href="mailto:enhjinbataa207@gmail.com"
            >
              enhjinbataa207@gmail.com
            </a>
            .
          </p>
        </div>
      </section>
    </main>
  );
}
