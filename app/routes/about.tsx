import type {Route} from './+types/about';
import AboutPage from '~/content/about.mdx';

export const meta: Route.MetaFunction = () => {
  return [{title: 'About | Wakey'}];
};

export default function About() {
  return <AboutPage />;
}
