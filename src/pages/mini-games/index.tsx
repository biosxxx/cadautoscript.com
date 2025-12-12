import React from 'react';
import Layout from '@theme/Layout';
import Link from '@docusaurus/Link';
import {miniGames} from '@site/src/data/miniGames';
import styles from './miniGames.module.css';

export default function MiniGamesIndex() {
  return (
    <Layout title="Mini Games" description="Quick engineering-themed mini games.">
      <main className={styles.container}>
        <header className={styles.hero}>
          <div>
            <p className={styles.eyebrow}>Mini Games</p>
            <h1 className={styles.title}>Engineering mini games</h1>
            <p className={styles.lead}>
              Quick, browser-friendly games inspired by CAD, QA, and shop-floor problem solving.
            </p>
          </div>
        </header>
        <section className={styles.grid}>
          {miniGames.map((game) => (
            <Link key={game.id} to={game.href} className={styles.card}>
              <div className={styles.cardBody}>
                <p className={styles.cardEyebrow}>{game.tech}</p>
                <h2 className={styles.cardTitle}>{game.name}</h2>
                <p className={styles.cardDesc}>{game.description}</p>
                <div className={styles.tagRow}>
                  {game.tags.map((tag) => (
                    <span key={tag} className={styles.tag}>
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </Link>
          ))}
        </section>
      </main>
    </Layout>
  );
}
