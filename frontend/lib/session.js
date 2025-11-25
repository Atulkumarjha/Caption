export function getSessionId() {
    if (typeof window === "undefined") return null;

    let id = localStorage.getItem("session_id");

    if(!id) {
        id = crypto.randomUUID();
        localStorage.setItem("session_id", id);
    }

    return id;
}