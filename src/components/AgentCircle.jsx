// Solid color circle with the agent's character cropped inside it
// (same markup and crop data as the thumbnails of the agent selector).
export default function AgentCircle({ agent }) {
  const [size, left, top] = agent.thumbnail.crop
  return (
    <div className="agent-circle" style={{ backgroundColor: agent.color }}>
      <span className="agent-circle__clip">
        <img
          src={agent.thumbnail.src}
          alt={agent.name}
          width={80}
          height={80}
          decoding="async"
          style={{
            left: `${left}%`,
            top: `${top}%`,
            width: `${size}%`,
            height: `${size}%`,
          }}
        />
      </span>
    </div>
  )
}
