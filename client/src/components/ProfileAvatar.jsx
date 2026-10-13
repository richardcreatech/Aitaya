function ProfileAvatar({ src, name, className = "" }) {
  const initials =
    name
      ?.trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0])
      .join("")
      .toUpperCase() || "G";

  return (
    <span
      className={`following_avatar ${className}`}
      aria-label={`${name || "User"}'s profile`}
    >
      <span className="following_avatar_initials">{initials}</span>

      {src && (
        <img
          src={src}
          alt=""
          onError={(event) => {
            event.currentTarget.style.display = "none";
          }}
        />
      )}
    </span>
  );
}

export default ProfileAvatar;