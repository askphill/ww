import type {Route} from './+types/_index';
import Home from '~/content/home.mdx';

export const meta: Route.MetaFunction = () => {
  return [{title: 'Wakey | Feel-Good Morning Rituals'}];
};

export default function Homepage() {
  return <Home />;
}
