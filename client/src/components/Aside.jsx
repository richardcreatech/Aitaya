import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBars,
  faHome,
  faInbox,
  faMagnifyingGlass,
  faPlane,
  faUpload,
  faUserFriends,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";
import logo from "../assets/logo.png";
import logo_mini from "../assets/logo-mini.png";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import API_URL from "../api/my_api_url";

function Aside({ collapsed, setCollapsed }) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    async function getUser() {
      try {
        const response = await fetch(`${API_URL}/api/me`, {
          credentials: "include",
        });

        const data = await response.json();

        if (!response.ok) {
          console.error(data.message);
          return;
        }

        setUser(data.user);
      } catch (error) {
        console.error("Unable to fetch user profile:", error);
      }
    }

    getUser();
  }, [user]);

  return (
    <aside className={collapsed ? "collapsed" : ""}>
      {/* Logo */}
      <div className="aside_header">
        <img src={collapsed ? logo_mini : logo} alt="Logo" />

        <button
          type="button"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          aria-expanded={!collapsed}
          onClick={() => setCollapsed((current) => !current)}
        >
          <FontAwesomeIcon icon={faBars} />
        </button>
      </div>
      {/* Search */}
      <span className="search_box">
        <FontAwesomeIcon icon={faMagnifyingGlass} />

        {!collapsed && <input type="text" placeholder="Search" />}
      </span>

      {/* Navigation */}
      <nav>
        <ul>
          <li>
            <Link to="/en">
              <FontAwesomeIcon icon={faHome} />
              {!collapsed && <p>For You</p>}
            </Link>
          </li>
          <li>
            <Link to="/en/following">
              <FontAwesomeIcon icon={faPlane} />
              {!collapsed && <p>Following</p>}
            </Link>
          </li>
          <li>
            <Link to="/en/profile">
              <span>
                <img
                  src={
                    user?.profile_picture ||
                    "https://i.pinimg.com/1200x/2c/b9/37/2cb937b15158720ddb7be0ed57caaf6f.jpg"
                  }
                  alt={
                    user?.username ? `${user.username}'s profile` : "Profile"
                  }
                />
              </span>

              {!collapsed && <p>Profile</p>}
            </Link>
          </li>
          <li className="mobile_upload_item">
            <Link to="/en/upload">
              <span className="mobile_upload_icon">
                <FontAwesomeIcon icon={faUpload} />
              </span>

              {!collapsed && <p>Upload</p>}

              <span className="mobile_upload_label">Upload</span>
            </Link>
          </li>
          <li>
            <Link to="/en/friends">
              <FontAwesomeIcon icon={faUserFriends} />
              {!collapsed && <p>Friends</p>}
            </Link>
          </li>
          <li>
            <Link to="/en/inbox">
              <FontAwesomeIcon icon={faInbox} />
              {!collapsed && <p>Inbox</p>}
            </Link>
          </li>
          <li className="mobile_search_item">
            <button
              type="button"
              aria-label="Open search"
              onClick={() => setSearchOpen(true)}
            >
              <FontAwesomeIcon icon={faMagnifyingGlass} />
              <span>Search</span>
            </button>
          </li>
        </ul>
      </nav>
      {searchOpen && (
        <div
          className="mobile_search_overlay"
          role="presentation"
          onClick={() => setSearchOpen(false)}
        >
          <section
            className="mobile_search_dialog"
            role="dialog"
            aria-modal="true"
            aria-label="Search"
            onClick={(event) => event.stopPropagation()}
          >
            <label htmlFor="mobile_search_input">Search</label>
            <input
              id="mobile_search_input"
              type="search"
              placeholder="Search"
              autoFocus
            />
            <button
              type="button"
              aria-label="Close search"
              onClick={() => setSearchOpen(false)}
            >
              <FontAwesomeIcon icon={faXmark} />
            </button>
          </section>
        </div>
      )}
    </aside>
  );
}

export default Aside;
