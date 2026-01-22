interface ContactItemProps {
  title: string;
  email?: string;
  address?: string[];
}

interface ContactSectionProps {
  title?: string;
  description?: React.ReactNode;
  items: ContactItemProps[];
}

function ContactItem({title, email, address}: ContactItemProps) {
  return (
    <div className="py-6 border-t border-text/10 first:border-t-0">
      <h3 className="text-label font-display uppercase tracking-wide opacity-60 mb-2">
        {title}
      </h3>
      <div className="text-s2 font-display">
        {email && (
          <a
            href={`mailto:${email}`}
            className="hover:opacity-70 transition-opacity"
          >
            {email}
          </a>
        )}
        {address && (
          <address className="not-italic">
            {address.map((line, i) => (
              <span key={i}>
                {line}
                {i < address.length - 1 && <br />}
              </span>
            ))}
          </address>
        )}
      </div>
    </div>
  );
}

export function ContactSection({
  title,
  description,
  items,
}: ContactSectionProps) {
  return (
    <section className="bg-sand px-4 py-8 md:p-0 md:grid md:grid-cols-24 md:px-8 md:pb-24">
      {title && (
        <h2 className="text-h3 font-display md:col-span-24">{title}</h2>
      )}

      {/* Text Column */}
      {description && (
        <div className="text-paragraph font-display pt-8 md:pt-20 md:col-span-7">
          {description}
        </div>
      )}

      {/* Contact Details Column */}
      <div className="pt-8 md:pt-20 md:col-start-11 md:col-span-14">
        {items.map((item, index) => (
          <ContactItem key={index} {...item} />
        ))}
      </div>
    </section>
  );
}
