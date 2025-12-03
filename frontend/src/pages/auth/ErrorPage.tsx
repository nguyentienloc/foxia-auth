import { useEffect, useState } from "react";
import { useNavigate, useSearch } from "@tanstack/react-router";
import ApiAuth from "../../api/auth.api";
import { FlowMessages } from "../../components/flow/FlowMessages";
import { UiText } from "../../types/kratos";

type ErrorPageSearch = {
  id?: string;
};

export default function ErrorPage() {
  const navigate = useNavigate();
  const search = useSearch({ from: "/error" }) as ErrorPageSearch;
  const [errorData, setErrorData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessages, setErrorMessages] = useState<UiText[]>([]);

  useEffect(() => {
    const fetchError = async () => {
      if (!search.id) {
        setErrorMessages([
          {
            text: "Error ID không được cung cấp",
            type: "error",
          },
        ]);
        setLoading(false);
        return;
      }

      try {
        // Call backend API to get error details from Kratos
        const data = await ApiAuth.getErrorFlow(search.id);
        setErrorData(data);

        // Extract error messages if available
        if (data.error) {
          setErrorMessages([
            {
              text: data.error.message || data.error.reason || "Đã xảy ra lỗi",
              type: "error",
            },
          ]);
        } else if (data.ui?.messages) {
          setErrorMessages(data.ui.messages);
        }
      } catch (error) {
        console.error("Error fetching error details:", error);
        setErrorMessages([
          {
            text: "Không thể tải thông tin lỗi. Vui lòng thử lại sau.",
            type: "error",
          },
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchError();
  }, [search.id]);

  return (
    <div className="min-h-screen bg-foxia-50 text-slate-800 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden">
        <div className="p-8 lg:p-12">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 mb-4">
              <svg
                className="w-8 h-8 text-red-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-slate-900 mb-2">
              Đã xảy ra lỗi
            </h1>
            <p className="text-slate-500">
              {search.id ? `Error ID: ${search.id}` : "Không có thông tin lỗi"}
            </p>
          </div>

          {loading ? (
            <div className="text-center py-8">
              <p className="text-slate-500">Đang tải thông tin lỗi...</p>
            </div>
          ) : (
            <>
              <FlowMessages messages={errorMessages} />

              {errorData && (
                <div className="mt-6 space-y-4">
                  {errorData.error && (
                    <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                      <h3 className="font-semibold text-red-900 mb-2">
                        Chi tiết lỗi:
                      </h3>
                      <div className="space-y-2 text-sm">
                        {errorData.error.id && (
                          <p>
                            <span className="font-medium">Error ID:</span>{" "}
                            {errorData.error.id}
                          </p>
                        )}
                        {errorData.error.code && (
                          <p>
                            <span className="font-medium">Code:</span>{" "}
                            {errorData.error.code}
                          </p>
                        )}
                        {errorData.error.status && (
                          <p>
                            <span className="font-medium">Status:</span>{" "}
                            {errorData.error.status}
                          </p>
                        )}
                        {errorData.error.message && (
                          <p>
                            <span className="font-medium">Message:</span>{" "}
                            {errorData.error.message}
                          </p>
                        )}
                        {errorData.error.reason && (
                          <p className="mt-2">
                            <span className="font-medium">Reason:</span>
                            <br />
                            <span className="text-slate-600 break-all">
                              {errorData.error.reason}
                            </span>
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {errorData.redirect_browser_to && (
                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                      <h3 className="font-semibold text-blue-900 mb-2">
                        Redirect URL:
                      </h3>
                      <p className="text-sm text-blue-800 break-all">
                        {errorData.redirect_browser_to}
                      </p>
                    </div>
                  )}

                  {/* Show full error data in development */}
                  {import.meta.env.DEV && (
                    <details className="mt-4">
                      <summary className="cursor-pointer text-sm font-medium text-slate-600 hover:text-slate-900">
                        Raw Error Data (Dev only)
                      </summary>
                      <pre className="mt-2 p-4 bg-slate-100 rounded-lg overflow-auto text-xs">
                        {JSON.stringify(errorData, null, 2)}
                      </pre>
                    </details>
                  )}
                </div>
              )}

              <div className="mt-8 flex gap-4 justify-center">
                <button
                  onClick={() => navigate({ to: "/login" })}
                  className="px-6 py-3 bg-foxia-600 text-white rounded-xl font-semibold hover:bg-foxia-700 transition-colors"
                >
                  Quay lại đăng nhập
                </button>
                <button
                  onClick={() => navigate({ to: "/" })}
                  className="px-6 py-3 bg-slate-200 text-slate-700 rounded-xl font-semibold hover:bg-slate-300 transition-colors"
                >
                  Về trang chủ
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
