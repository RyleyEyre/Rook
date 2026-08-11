import { useEffect, useRef, useState } from 'react';
import { useLiveConnection } from '../features/sharedMessage/useLiveConnection.js';
import { useAuth } from '../context/AuthContext.jsx';
import { API_URL } from '../shared/api/config.js';
import { useApiFetch } from '../shared/api/useApi.js';

const SHARED_MESSAGE_ID = '11111111-1111-1111-1111-111111111111';

function Hello() {
    const { username, role, isAuthLoading } = useAuth();
    const apiFetch = useApiFetch();
    const inputRef = useRef(null);

    const [secureMessage, setSecureMessage] = useState(null);
    const [sharedContent, setSharedContent] = useState('');
    const [draftContent, setDraftContent] = useState('');
    const [hasNewerVersion, setHasNewerVersion] = useState(false);
    const [editingUsers, setEditingUsers] = useState(new Set());

    useEffect(() => {
        if (isAuthLoading) {
            return;
        }

        async function loadSecureData() {
            const response = await apiFetch(`${API_URL}/api/Test/secure`);
            const text = await response.text();
            setSecureMessage(text);
        }

        async function loadSharedMessage() {
            const response = await apiFetch(`${API_URL}/api/SharedMessage/${SHARED_MESSAGE_ID}`);
            const body = await response.json();
            setSharedContent(body.data.content);
            setDraftContent(body.data.content);
        }

        loadSecureData();
        loadSharedMessage();
    }, [isAuthLoading]);

    // Live updates from other users editing the same shared message — the
    // group name here must exactly match what UpdateSharedMessageService
    // broadcasts to on the backend.
    const connectionRef = useLiveConnection(`SharedMessage:${SHARED_MESSAGE_ID}`, {
        MessageUpdated: (content) => {
            if (document.activeElement === inputRef.current) {
                setSharedContent(content);
                setHasNewerVersion(true);
            } else {
                setSharedContent(content);
                setDraftContent(content);
            }
        },
        UserEditing: (editingUsername) => {
            setEditingUsers((prev) => new Set(prev).add(editingUsername));
        },
        UserStoppedEditing: (editingUsername) => {
            setEditingUsers((prev) => {
                const next = new Set(prev);
                next.delete(editingUsername);
                return next;
            });
        },
    });

    const handleSharedMessageSubmit = async (e) => {
        e.preventDefault();

        await apiFetch(`${API_URL}/api/SharedMessage/${SHARED_MESSAGE_ID}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ content: draftContent }),
        });
    };

    if (isAuthLoading) {
        return <div>Loading...</div>;
    }
    if (role !== 'User') {
        return <div>Unauthorised</div>;
    }

    return (
        <div>
            <div>Hello, {username}!</div>
            <div>{secureMessage}</div>

            <hr />

            <h3>Shared message (live)</h3>
            <div>Current: {sharedContent}</div>

            {editingUsers.size > 0 && (
                <div>
                    {[...editingUsers].join(', ')} editing...
                </div>
            )}

            {hasNewerVersion && (
                <div>
                    A newer version is available.
                    <button onClick={() => {
                        setDraftContent(sharedContent);
                        setHasNewerVersion(false);
                    }}>
                        Load new version
                    </button>
                </div>
            )}

            <form onSubmit={handleSharedMessageSubmit}>
                <input
                    ref={inputRef}
                    type="text"
                    value={draftContent}
                    onChange={(e) => setDraftContent(e.target.value)}
                    onFocus={() => connectionRef.current?.invoke('NotifyEditing', `SharedMessage:${SHARED_MESSAGE_ID}`, username)}
                    onBlur={() => connectionRef.current?.invoke('NotifyStoppedEditing', `SharedMessage:${SHARED_MESSAGE_ID}`, username)}
                />
                <button type="submit">Update</button>
            </form>
        </div>
    );
}

export default Hello;