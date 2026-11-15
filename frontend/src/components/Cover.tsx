/** Same styled title placeholder the seeder uses for games without a Steam cover. */
const placeholder = (name: string) =>
  `https://placehold.co/460x600/351183/fad318/png?font=montserrat&text=${encodeURIComponent(name)}`

/**
 * A game cover. Covers load from Steam's servers; if one fails (unreachable, or the address changed),
 * swap once to the title placeholder so the card never shows a broken-image icon.
 */
export default function Cover({ src, name, alt = '', className = '' }: { src: string; name: string; alt?: string; className?: string }) {
  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      className={`bg-surface object-cover ${className}`}
      onError={(e) => {
        const fallback = placeholder(name)
        if (e.currentTarget.src !== fallback) e.currentTarget.src = fallback // the check stops a loop if the placeholder fails too
      }}
    />
  )
}
