import { useEffect, useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useSessionQuery } from '../../queries/auth.query';
import {
  useCreateLogoutFlow,
  useSubmitLogoutFlow,
} from '../../queries/auth.query';

export default function ProfilePage() {
  const navigate = useNavigate();
  const { data, isLoading, error } = useSessionQuery();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const createLogoutFlow = useCreateLogoutFlow();
  const submitLogoutFlow = useSubmitLogoutFlow();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && (error || !data)) {
      navigate({ to: '/login' });
    }
  }, [isLoading, error, data, navigate]);

  if (isLoading) {
    return (
      <section className="page-card">
        <p>Đang tải thông tin phiên...</p>
      </section>
    );
  }

  if (error || !data) {
    return (
      <section className="page-card">
        <p>Đang chuyển hướng...</p>
      </section>
    );
  }

  // Extract data from response (could be wrapped in 'data' by TransformInterceptor)
  const responseData = (data as any)?.data || data;
  const identity = responseData?.identity;
  const session = responseData?.session;

  if (!identity) {
    return (
      <section className="page-card">
        <h1>Không tìm thấy thông tin</h1>
        <p>Không thể tải thông tin tài khoản.</p>
      </section>
    );
  }

  const email = identity.traits?.email || 'N/A';
  const userId = identity.id || 'N/A';
  const state = identity.state || 'N/A';
  const emailVerified =
    identity.verifiable_addresses?.[0]?.verified ?? false;
  const sessionActive = session?.active ?? false;
  const sessionExpiresAt = session?.expires_at
    ? new Date(session.expires_at).toLocaleString('vi-VN')
    : 'N/A';
  const authenticatedAt = session?.authenticated_at
    ? new Date(session.authenticated_at).toLocaleString('vi-VN')
    : 'N/A';

  return (
    <section className="page-card">
      <h1>Thông tin tài khoản</h1>

      <div className="profile-section">
        <h2>Thông tin cá nhân</h2>
        <div className="profile-field">
          <label>Email:</label>
          <span>{email}</span>
        </div>
        <div className="profile-field">
          <label>User ID:</label>
          <span className="profile-value--mono">{userId}</span>
        </div>
        <div className="profile-field">
          <label>Trạng thái:</label>
          <span className={`profile-badge profile-badge--${state}`}>
            {state}
          </span>
        </div>
        <div className="profile-field">
          <label>Email đã xác minh:</label>
          <span
            className={`profile-badge ${
              emailVerified
                ? 'profile-badge--verified'
                : 'profile-badge--unverified'
            }`}
          >
            {emailVerified ? 'Đã xác minh' : 'Chưa xác minh'}
          </span>
        </div>
      </div>

      <div className="profile-section">
        <h2>Thông tin phiên đăng nhập</h2>
        <div className="profile-field">
          <label>Trạng thái phiên:</label>
          <span
            className={`profile-badge ${
              sessionActive
                ? 'profile-badge--active'
                : 'profile-badge--inactive'
            }`}
          >
            {sessionActive ? 'Đang hoạt động' : 'Không hoạt động'}
          </span>
        </div>
        <div className="profile-field">
          <label>Đăng nhập lúc:</label>
          <span>{authenticatedAt}</span>
        </div>
        <div className="profile-field">
          <label>Hết hạn lúc:</label>
          <span>{sessionExpiresAt}</span>
        </div>
      </div>

      <div className="profile-actions">
        <button
          className="flow-submit flow-submit--danger"
          onClick={() => setShowLogoutConfirm(true)}
          disabled={createLogoutFlow.isPending || submitLogoutFlow.isPending}
        >
          {createLogoutFlow.isPending || submitLogoutFlow.isPending
            ? 'Đang đăng xuất...'
            : 'Đăng xuất'}
        </button>
      </div>

      {showLogoutConfirm && (
        <div className="modal-overlay" onClick={() => setShowLogoutConfirm(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Xác nhận đăng xuất</h3>
            <p>Bạn có chắc chắn muốn đăng xuất không?</p>
            <div className="modal-actions">
              <button
                className="flow-submit flow-submit--secondary"
                onClick={() => setShowLogoutConfirm(false)}
              >
                Hủy
              </button>
              <button
                className="flow-submit flow-submit--danger"
                onClick={async () => {
                  try {
                    // Create logout flow
                    const logoutFlow = await createLogoutFlow.mutateAsync(undefined);
                    const responseData = (logoutFlow as any)?.data || logoutFlow;
                    
                    // If logout_token exists, submit logout
                    if (responseData?.logout_token) {
                      await submitLogoutFlow.mutateAsync(responseData.logout_token);
                    } else if (responseData?.logout_url) {
                      // If logout_url exists, redirect
                      window.location.href = responseData.logout_url;
                      return;
                    }
                    
                    // Navigate to login after successful logout
                    navigate({ to: '/login' });
                  } catch (error) {
                    console.error('Logout error:', error);
                    setShowLogoutConfirm(false);
                  }
                }}
                disabled={createLogoutFlow.isPending || submitLogoutFlow.isPending}
              >
                {createLogoutFlow.isPending || submitLogoutFlow.isPending
                  ? 'Đang xử lý...'
                  : 'Xác nhận'}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}


