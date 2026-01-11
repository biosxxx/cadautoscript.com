import Head from '@docusaurus/Head';
import SmashBottlesGame from '@site/src/components/SmashBottlesGame';

export default function SmashBottlesPage() {
    return (
        <>
            <Head>
                <title>Smash Bottles | CAD AutoScript</title>
                <meta name="description" content="Railroad Bottle Smash Game" />
            </Head>
            <div style={{
                width: '100vw',
                height: '100vh',
                position: 'fixed',
                top: 0,
                left: 0,
                zIndex: 1000,
            }}>
                <SmashBottlesGame />
            </div>
        </>
    );
}
