export default function ReferenceImageModule({ fileName, alt }) {
  const src = `/modulos-referencia/${encodeURIComponent(fileName)}`;

  return (
    <section className="flex h-full w-full items-center justify-center bg-black p-2 sm:p-4">
      <img
        src={src}
        alt={alt}
        className="h-full w-full object-contain"
        loading="eager"
      />
    </section>
  );
}
