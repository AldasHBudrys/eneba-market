/** Same styled title placeholder the seeder uses for games without a Steam cover. */
const placeholder = (name: string) =>
  `https://placehold.co/460x600/351183/fad318/png?font=montserrat&text=${encodeURIComponent(name)}`

type Props = { src: string; name: string; alt?: string; className?: string; fallback?: string }

/**
 * A game cover (or banner). Images load from Steam's servers; if one fails (unreachable, or the address changed),
 * swap once to a placeholder so the page never shows a broken-image icon. `fallback` overrides the portrait placeholder.
 */
export default function Cover({ src, name, alt = '', className = '', fallback }: Props) {
  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      className={`bg-surface object-cover ${className}`}
      onError={(e) => {
        const replacement = fallback ?? placeholder(name)
        if (e.currentTarget.src !== replacement) e.currentTarget.src = replacement // the check stops a loop if the placeholder fails too
      }}
    />
  )
}
