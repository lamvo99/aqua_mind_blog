interface AdSlotProps {
  position?: string
  className?: string
}

/**
 * AdSlot — container dành sẵn cho quảng cáo.
 * - Khi chưa có ads thật: render ẩn (display:none) nhưng chiếm layout space.
 * - Khi có ads: bỏ class "hidden" và inject mã quảng cáo vào đây.
 *
 * position: tên vị trí để dễ dàng mapping sau này:
 *   "header-banner"  — dưới header
 *   "in-feed"        — giữa danh sách bài viết
 *   "sidebar"        — sidebar (layout 2 cột)
 *   "below-content"  — dưới nội dung bài viết
 */
export default function AdSlot({ position = "header-banner", className = "" }: AdSlotProps) {
  const sizeMap: Record<string, { width: string; height: string }> = {
    "header-banner": { width: "728px", height: "90px" },
    "in-feed": { width: "336px", height: "280px" },
    "sidebar": { width: "300px", height: "600px" },
    "below-content": { width: "728px", height: "90px" },
  }

  const size = sizeMap[position] || { width: "300px", height: "250px" }

  return (
    <div
      id={`ad-slot-${position}`}
      className={`ad-slot hidden ${className}`}
      data-ad-position={position}
      style={{
        minHeight: size.height,
        minWidth: size.width,
        aspectRatio: `${parseInt(size.width)} / ${parseInt(size.height)}`,
      }}
      aria-hidden="true"
    />
  )
}
