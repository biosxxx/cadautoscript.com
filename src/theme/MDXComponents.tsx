import type {MDXComponentsObject} from '@theme/MDXComponents';
import MDXComponents from '@theme-original/MDXComponents';

import AuthTest from '@site/src/components/AuthTest';

export default {
  ...MDXComponents,
  AuthTest,
} satisfies MDXComponentsObject;
