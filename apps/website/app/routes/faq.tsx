import type {Route} from './+types/faq';
import FAQPage from '~/content/faq.mdx';

// FAQ items for JSON-LD schema
const FAQ_ITEMS = [
  {
    question: 'How can I contact you?',
    answer:
      'You can email us via support@wakey.care. We aim to respond within 24 hours.',
  },
  {
    question: 'How long does shipping take?',
    answer:
      'Domestic delivery within the Netherlands takes 1-2 business days.',
  },
  {
    question: 'What are the shipping costs?',
    answer:
      'Shipping is €3.95 for Netherlands and Belgium. Orders above €50 qualify for free shipping.',
  },
  {
    question: 'What is your return policy?',
    answer:
      'We offer a 14-day return window. Products must be unused and carefully handled to qualify for a return.',
  },
  {
    question: 'How does natural deodorant work?',
    answer:
      'Our natural deodorant uses ingredients like arrowroot powder and magnesium hydroxide to neutralize odor-causing bacteria. Unlike antiperspirants, it allows your body to sweat naturally while keeping you fresh.',
  },
  {
    question: 'Is there an adjustment period when switching?',
    answer:
      'When transitioning from conventional antiperspirants, your body may need time to adjust. This typically takes under two weeks.',
  },
  {
    question: 'Does it contain aluminum or baking soda?',
    answer:
      'No! Our formula is completely aluminum-free and baking soda-free. We use safe, natural alternatives that are gentle on your skin.',
  },
  {
    question: 'Is it vegan and cruelty-free?',
    answer:
      'Absolutely! Our products are 100% vegan, phthalate-free, and paraben-free. We never test on animals.',
  },
  {
    question: 'Is it safe for sensitive skin?',
    answer:
      'Yes! Our baking soda-free formula is specifically designed to be gentle on all skin types, including sensitive skin.',
  },
];

const FAQ_SCHEMA = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: FAQ_ITEMS.map((item) => ({
    '@type': 'Question',
    name: item.question,
    acceptedAnswer: {
      '@type': 'Answer',
      text: item.answer,
    },
  })),
};

export const meta: Route.MetaFunction = () => {
  return [
    {title: 'FAQ | Wakey'},
    {
      name: 'description',
      content:
        'Got questions about Wakey natural deodorant? Find answers about ingredients, shipping, returns, and how to transition to natural deodorant.',
    },
    {property: 'og:title', content: 'FAQ | Wakey'},
    {
      property: 'og:description',
      content:
        'Got questions about Wakey natural deodorant? Find answers about ingredients, shipping, returns, and more.',
    },
    {property: 'og:type', content: 'website'},
    {property: 'og:url', content: 'https://wakeywakey.com/faq'},
    {name: 'twitter:card', content: 'summary'},
    {name: 'twitter:title', content: 'FAQ | Wakey'},
    {
      name: 'twitter:description',
      content:
        'Got questions about Wakey natural deodorant? Find answers about ingredients, shipping, returns, and more.',
    },
    {rel: 'canonical', href: 'https://wakeywakey.com/faq'},
    {
      'script:ld+json': FAQ_SCHEMA,
    },
  ];
};

export default function FAQ() {
  return <FAQPage />;
}
