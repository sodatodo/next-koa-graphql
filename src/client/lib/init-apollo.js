import { ApolloClient } from 'apollo-client';
import { HttpLink } from 'apollo-link-http';
import { setContext } from 'apollo-link-context';
import { InMemoryCache } from 'apollo-cache-inmemory';
import fetch from 'isomorphic-unfetch';

let apolloClient = null;

// Polyfill fetch() on the server (used by apollo-client)
if (!process.browser) {
  global.fetch = fetch;
}

function create(initialState, headers) {
  const authLink = setContext(() => {
    if (Object.keys(headers).length > 0) {
      return {
        headers
      };
    }

    return {};
  });

  const httpLink = new HttpLink({
    uri: 'http://localhost:4000/api',
    credentials: 'same-origin'
  });

  return new ApolloClient({
    connectToDevTools: process.browser,
    ssrMode: !process.browser, // Disables forceFetch on the server (so queries are only run once)
    link: authLink.concat(httpLink),
    cache: new InMemoryCache().restore(initialState || {})
  });
}

export default function initApollo(initialState, headers) {
  // Make sure to create a new client for every server-side request so that data
  // isn't shared between connections (which would be bad)
  if (!process.browser) {
    return create(initialState, headers);
  }

  // Reuse client on the client-side
  if (!apolloClient) {
    apolloClient = create(initialState, headers);
  }

  return apolloClient;
}
