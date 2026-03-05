export default function SkeletonLoader({ rows = 3, height = 40 }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="skeleton"
          style={{ height: `${height}px`, width: '100%' }}
        />
      ))}
    </div>
  );
}
