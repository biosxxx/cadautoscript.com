import React from 'react';
import Layout from '@theme/Layout';
import Head from '@docusaurus/Head';
import MdxPostEditor from '@site/src/components/DocParser/MdxPostEditor';

export default function DocParserPage() {
  return (
    <Layout title="MDX Post Editor" description="Author MDX with live preview and snippets.">
      <Head>
        <meta name="robots" content="noindex" />
      </Head>
      <MdxPostEditor />
    </Layout>
  );
}
