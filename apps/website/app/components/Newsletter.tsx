import {useState} from 'react';
import {Button, Input, CheckCircleIcon} from '@wakey/ui';

export function Newsletter() {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setIsSubmitting(true);

    // Dummy delay to simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));

    setIsSubmitting(false);
    setIsSuccess(true);
  };

  return (
    <section className="bg-sand p-4 md:p-8 pt-12 md:pt-20 pb-4 md:pb-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 items-end">
        {/* Heading */}
        <h2 className="text-h2 font-display">
          Join the
          <br />
          good morning
          <br />
          <em className="font-body">movement</em>
        </h2>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-2">
          <Input
            type="email"
            name="email"
            placeholder="Email"
            required
            aria-label="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isSuccess}
            icon={isSuccess ? <CheckCircleIcon /> : undefined}
          />
          <Button
            type="submit"
            variant="outline"
            disabled={isSubmitting || isSuccess}
          >
            {isSubmitting
              ? 'Subscribing...'
              : isSuccess
                ? 'Thank you'
                : 'Subscribe'}
          </Button>
        </form>
      </div>
    </section>
  );
}
