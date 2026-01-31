export default function Loading({ fullScreen = false, message = 'Loading...' }) {
  return (
    <div className={`loading ${fullScreen ? 'fullscreen' : ''}`}>
      <div className="loading-content">
        {/* Cricket ball spinner */}
        <div className="cricket-loader">
          <div className="cricket-ball">
            <div className="ball-seam"></div>
          </div>
          <div className="ball-shadow"></div>
        </div>

        {/* Loading text with dots animation */}
        <div className="loading-text">
          <span>{message}</span>
          <span className="loading-dots">
            <span className="dot">.</span>
            <span className="dot">.</span>
            <span className="dot">.</span>
          </span>
        </div>
      </div>
    </div>
  )
}
