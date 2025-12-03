import type {MDXComponentsObject} from '@theme/MDXComponents';
import MDXComponents from '@theme-original/MDXComponents';

import AuthTest from '@site/src/components/AuthTest';
import ReactionsBar from '@site/src/components/Reactions/ReactionsBar';

export default {
  ...MDXComponents,
  AuthTest,
  ReactionsBar,
} satisfies MDXComponentsObject;
