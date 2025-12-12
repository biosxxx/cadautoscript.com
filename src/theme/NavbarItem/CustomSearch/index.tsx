import {useEffect, useMemo, useRef, useState} from 'react';
import clsx from 'clsx';
import Link from '@docusaurus/Link';
import {searchIndex} from '@site/src/data/searchIndex';
import styles from './styles.module.css';

type Props = {
  className?: string;
  mobile?: boolean;
};

function useSearchResults(query: string) {
  return useMemo(() => {
    const value = query.trim().toLowerCase();
    if (!value) {
      return searchIndex.slice(0, 6);
    }
    return searchIndex
      .filter((record) => {
        const haystack = [record.title, record.description, ...record.tags].join(' ').toLowerCase();
        return haystack.includes(value);
      })
      .slice(0, 8);
  }, [query]);
}

export default function CustomSearchNavbarItem({className, mobile}: Props): JSX.Element {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement | null>(null);
  const results = useSearchResults(query);

  useEffect(() => {
    if (!isOpen) {
      setQuery('');
      return undefined;
    }

    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };
    document.addEventListener('keydown', handleKey);
    const handle = window.setTimeout(() => {
      inputRef.current?.focus();
    }, 0);
    return () => {
      document.removeEventListener('keydown', handleKey);
      window.clearTimeout(handle);
    };
  }, [isOpen]);

  return (
    <>
      <button
        type="button"
        data-search-trigger
        className={clsx(
          'button button--primary',
          styles.trigger,
          {[styles.mobileTrigger]: mobile},
          className,
        )}
        onClick={() => setIsOpen(true)}
      >
        Search
      </button>
      {isOpen && (
        <div className={styles.backdrop} role="dialog" aria-modal="true" aria-label="Site search">
          <div className={styles.dialog}>
            <div className={styles.header}>
              <input
                ref={inputRef}
                className={styles.input}
                placeholder="Search utilities, docs, or blog posts..."
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
              <button type="button" className={styles.closeButton} onClick={() => setIsOpen(false)}>
                Esc
              </button>
            </div>
            <div className={styles.results}>
              {results.length === 0 ? (
                <p className={styles.empty}>No matches yet. Try another keyword.</p>
              ) : (
                results.map((record) => (
                  <a
                    key={record.href}
                    href={record.href}
                    className={styles.resultItem}
                    onClick={() => setIsOpen(false)}
                    data-nobrokenlinkcheck
                  >
                    <span>
                      <strong>{record.title}</strong>
                      <span className={styles.description}>{record.description}</span>
                    </span>
                    <span className={styles.tags}>
                      {record.tags.slice(0, 3).map((tag) => (
                        <span key={tag} className={styles.tag}>
                          {tag}
                        </span>
                      ))}
                    </span>
                  </a>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
