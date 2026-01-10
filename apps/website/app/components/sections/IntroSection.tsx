import {Button} from '@wakey/ui';

interface IntroSectionProps {
  heading: React.ReactNode;
  description: string;
  buttonText?: string;
  buttonTo?: string;
}

export function IntroSection({
  heading,
  description,
  buttonText = 'About our story',
  buttonTo = '/about',
}: IntroSectionProps) {
  return (
    <section className="relative overflow-hidden rounded-card bg-sand p-4 md:grid md:grid-cols-12 md:pt-12 md:px-8 md:pb-32">
      <div className="text-h1 md:col-span-9">{heading}</div>
      <div className="flex flex-col md:col-span-3 md:justify-end">
        <p className="max-w-56 pt-44 pb-4 text-paragraph text-text md:max-w-none md:pt-0 md:pr-8">
          {description}
        </p>
        <Button to={buttonTo} variant="outline">
          {buttonText}
        </Button>
      </div>
    </section>
  );
}
