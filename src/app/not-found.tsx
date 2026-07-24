import Link from 'next/link';
import styles from './not-found.module.css';

export default function NotFound() {
  return (
    <div className={styles.page}>
      <div className={styles.logoWrap}>
        <img
          src="/images/logo/logo-vertical-white.png"
          alt="GODSMOVE"
          className={styles.logo}
        />
      </div>
      <h1 className={styles.title}>404</h1>
      <p className={styles.text}>
        This page isn't available.
      </p>
      <Link href="/drops" className={styles.homeBtn}>
        Return to the collection
      </Link>
    </div>
  );
}
