import {notifications} from '~/content/notifications';

export async function loader() {
  return new Response(JSON.stringify({notifications}), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}
