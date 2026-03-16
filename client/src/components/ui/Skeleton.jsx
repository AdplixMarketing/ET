import styles from './Skeleton.module.css';

export default function Skeleton({ width, height, borderRadius, style, className }) {
  return (
    <div
      className={`${styles.skeleton} ${className || ''}`}
      style={{
        width: width || '100%',
        height: height || 16,
        borderRadius: borderRadius || 8,
        ...style,
      }}
    />
  );
}
