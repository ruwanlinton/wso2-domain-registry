"use client";

import { useState, useEffect } from "react";
import { MOCK_USERS, MockUser, ROLE_PERMISSIONS } from "@/lib/types";
import clsx from "clsx";

const STORAGE_KEY = "wso2-domain-registry-user";

export function useCurrentUser(): [MockUser, (user: MockUser) => void] {
  const [currentUser, setCurrentUser] = useState<MockUser>(MOCK_USERS[1]);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        const found = MOCK_USERS.find((u) => u.id === parsed.id);
        if (found) setCurrentUser(found);
      } catch {
        // ignore
      }
    }
  }, []);

  const setUser = (user: MockUser) => {
    setCurrentUser(user);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    window.dispatchEvent(new Event("userchange"));
  };

  return [currentUser, setUser];
}

const roleColorMap: Record<string, string> = {
  VIEWER: "bg-gray-100 text-gray-700",
  DEVELOPER: "bg-blue-100 text-blue-700",
  DOMAIN_OWNER: "bg-purple-100 text-purple-700",
  APPROVER: "bg-orange-100 text-orange-700",
  ADMIN: "bg-red-100 text-red-700",
};

export function UserSwitcher() {
  const [currentUser, setCurrentUser] = useCurrentUser();
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
      >
        <div className="w-8 h-8 rounded-full bg-wso2-orange text-white flex items-center justify-center text-sm font-semibold">
          {currentUser.avatar}
        </div>
        <div className="text-left hidden sm:block">
          <p className="text-sm font-medium text-gray-900">{currentUser.name}</p>
          <span
            className={clsx(
              "text-xs px-1.5 py-0.5 rounded font-medium",
              roleColorMap[currentUser.role]
            )}
          >
            {ROLE_PERMISSIONS[currentUser.role].label}
          </span>
        </div>
        <svg
          className="w-4 h-4 text-gray-500"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setOpen(false)}
          />
          <div className="absolute right-0 mt-1 w-64 bg-white rounded-lg shadow-lg border border-gray-200 z-20 py-1">
            <p className="px-3 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Switch User (Demo)
            </p>
            {MOCK_USERS.map((user) => (
              <button
                key={user.id}
                onClick={() => {
                  setCurrentUser(user);
                  setOpen(false);
                }}
                className={clsx(
                  "w-full flex items-center gap-3 px-3 py-2 hover:bg-gray-50 transition-colors",
                  currentUser.id === user.id && "bg-orange-50"
                )}
              >
                <div className="w-8 h-8 rounded-full bg-wso2-orange text-white flex items-center justify-center text-xs font-semibold flex-shrink-0">
                  {user.avatar}
                </div>
                <div className="text-left min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {user.name}
                  </p>
                  <span
                    className={clsx(
                      "text-xs px-1.5 py-0.5 rounded font-medium",
                      roleColorMap[user.role]
                    )}
                  >
                    {ROLE_PERMISSIONS[user.role].label}
                  </span>
                </div>
                {currentUser.id === user.id && (
                  <svg
                    className="w-4 h-4 text-wso2-orange ml-auto flex-shrink-0"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
