import Layout from '@theme/Layout';
import EcoSortGame from '@site/src/components/EcoSortGame';

export default function EcoSortPage() {
    return (
        <Layout
            title="Eco Sort Game"
            description="Sort trash into the correct bins!"
            noFooter
        >
            <div style={{ width: '100vw', height: 'calc(100vh - 60px)' }}>
                <EcoSortGame />
            </div>
        </Layout>
    );
}
