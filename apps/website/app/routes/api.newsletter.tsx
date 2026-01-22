import type {Route} from './+types/api.newsletter';

const CUSTOMER_CREATE_MUTATION = `#graphql
  mutation customerCreate($input: CustomerCreateInput!) {
    customerCreate(input: $input) {
      customer {
        id
        email
      }
      customerUserErrors {
        code
        field
        message
      }
    }
  }
`;

export async function action({request, context}: Route.ActionArgs) {
  const {storefront} = context;

  const formData = await request.formData();
  const email = formData.get('email');

  if (!email || typeof email !== 'string') {
    return new Response(
      JSON.stringify({success: false, error: 'Email is required'}),
      {status: 400, headers: {'Content-Type': 'application/json'}},
    );
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return new Response(
      JSON.stringify({success: false, error: 'Invalid email format'}),
      {status: 400, headers: {'Content-Type': 'application/json'}},
    );
  }

  try {
    const password = `newsletter-${crypto.randomUUID()}`;
    const {customerCreate} = await storefront.mutate(CUSTOMER_CREATE_MUTATION, {
      variables: {
        input: {
          email,
          acceptsMarketing: true,
          password,
        },
      },
    });

    const errors = customerCreate?.customerUserErrors;

    if (errors && errors.length > 0) {
      // Check if customer already exists (they may already be subscribed)
      const alreadyExists = errors.some((error) => error.code === 'TAKEN');

      if (alreadyExists) {
        // Return success even if email exists - they're already subscribed
        return new Response(JSON.stringify({success: true}), {
          status: 200,
          headers: {'Content-Type': 'application/json'},
        });
      }

      return new Response(
        JSON.stringify({
          success: false,
          error: errors[0]?.message || 'Failed to subscribe',
        }),
        {status: 400, headers: {'Content-Type': 'application/json'}},
      );
    }

    return new Response(JSON.stringify({success: true}), {
      status: 200,
      headers: {'Content-Type': 'application/json'},
    });
  } catch (error) {
    console.error('Newsletter subscription error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: 'An error occurred. Please try again.',
      }),
      {status: 500, headers: {'Content-Type': 'application/json'}},
    );
  }
}
