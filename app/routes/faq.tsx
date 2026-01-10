import type {Route} from './+types/faq';
import FAQPage from '~/content/faq.mdx';

export const meta: Route.MetaFunction = () => {
  return [{title: 'FAQ | Wakey'}];
};

export default function FAQ() {
  return <FAQPage />;
}
