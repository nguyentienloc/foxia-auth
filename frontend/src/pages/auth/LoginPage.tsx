import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { FlowRenderer } from "../../components/flow/FlowRenderer";
import { KratosFlow, UiText } from "../../types/kratos";
import {
  useCreateLoginFlow,
  useSessionQuery,
  useSubmitLoginFlow,
} from "../../queries/auth.query";
import {
  extractFlowFromError,
  extractErrorMessage,
  isCsrfError,
  clearCookies,
} from "../../utils/kratos";
import { FlowMessages } from "../../components/flow/FlowMessages";
import { useSessionStore } from "../../stores/session.store";

export default function LoginPage() {
  const navigate = useNavigate();
  const [flow, setFlow] = useState<KratosFlow | null>(null);
  const [errorMessages, setErrorMessages] = useState<UiText[]>([]);
  const createFlowMutation = useCreateLoginFlow();
  const submitFlowMutation = useSubmitLoginFlow();
  const sessionQuery = useSessionQuery(true);
  const session = useSessionStore((state) => state.session);
  const hasInitialized = useRef(false);

  const initializeFlow = useCallback(async () => {
    if (createFlowMutation.isPending) {
      return;
    }
    setErrorMessages([]);
    try {
      const data = await createFlowMutation.mutateAsync(undefined);
      setFlow(data as KratosFlow);
    } catch (error) {
      const messages = extractErrorMessage(error);
      setErrorMessages(messages);
      console.error("Error creating login flow:", error);
    }
  }, [createFlowMutation]);

  useEffect(() => {
    if (sessionQuery.data?.session) {
      navigate({ to: "/" });
    }
  }, [sessionQuery.data, navigate]);

  useEffect(() => {
    if (session) {
      navigate({ to: "/" });
    }
  }, [session, navigate]);

  useEffect(() => {
    if (hasInitialized.current) {
      return;
    }
    hasInitialized.current = true;
    setErrorMessages([]);
    initializeFlow();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmit = async (payload: Record<string, string | boolean>) => {
    if (!flow) return;

    if (!payload.csrf_token) {
      setErrorMessages([
        {
          text: "CSRF token không tìm thấy. Vui lòng tải lại trang và thử lại.",
          type: "error",
        },
      ]);
      return;
    }

    setErrorMessages([]);
    try {
      const response = await submitFlowMutation.mutateAsync({
        flowId: flow.id,
        payload,
      });

      let flowData: KratosFlow | undefined;
      if (
        response &&
        typeof response === "object" &&
        "data" in response &&
        response.data &&
        typeof response.data === "object" &&
        "id" in response.data &&
        "ui" in response.data
      ) {
        flowData = response.data as KratosFlow;
      } else if (
        response &&
        typeof response === "object" &&
        "id" in response &&
        "ui" in response
      ) {
        flowData = response as KratosFlow;
      }

      if (flowData) {
        const isInProgress =
          (flowData.state && flowData.state !== "success") ||
          (flowData.ui?.nodes && flowData.ui.nodes.length > 0);

        if (isInProgress) {
          setFlow(flowData);
          return;
        }
      }

      await sessionQuery.refetch();
      navigate({ to: "/" });
    } catch (error) {
      console.error("Submit login error:", error);

      if (isCsrfError(error)) {
        setErrorMessages([
          {
            text: "Lỗi bảo mật CSRF. Đang xóa cookies và tạo lại flow...",
            type: "error",
          },
        ]);
        clearCookies();
        hasInitialized.current = false;
        await new Promise((resolve) => setTimeout(resolve, 100));
        await initializeFlow();
        return;
      }

      const retryFlow = extractFlowFromError(error);
      if (retryFlow) {
        setFlow(retryFlow);
        setErrorMessages(retryFlow.ui.messages ?? []);
        return;
      }

      const errorMessages = extractErrorMessage(error);
      setErrorMessages(errorMessages);
    }
  };

  return (
    <div className="min-h-screen bg-foxia-50 text-slate-800 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-6xl bg-slate-900/90 rounded-3xl shadow-2xl overflow-hidden flex flex-col lg:flex-row">
        {/* Left visual panel */}
        <div className="hidden lg:flex lg:w-1/2 bg-slate-900 relative overflow-hidden items-center justify-center">
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1556761175-5973dc0f32e7?auto=format&fit=crop&w=1950&q=80')] bg-cover bg-center opacity-40" />
          <div className="absolute inset-0 bg-gradient-to-tr from-foxia-600/90 to-purple-900/80 mix-blend-multiply" />

          <div className="relative z-10 p-12 text-white max-w-lg space-y-6">
            <div className="flex items-center gap-3 mb-4">
              <svg
                className="w-10 h-10 text-white"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M12 2L3 8.5L12 22L21 8.5L12 2Z"
                  fill="currentColor"
                  className="opacity-90"
                />
                <path
                  d="M12 22L12 11.5M12 11.5L2 8.5M12 11.5L22 8.5"
                  stroke="white"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <span className="text-3xl font-bold tracking-tight">FOXIA</span>
            </div>
            <blockquote className="text-2xl font-light italic leading-relaxed">
              “Foxia helped us scale our operations by 300% in just six months.
              The most intuitive SaaS for business owners.”
            </blockquote>
            <div className="flex items-center gap-4 mt-6">
              <img
                src="https://randomuser.me/api/portraits/women/44.jpg"
                alt="User"
                className="w-12 h-12 rounded-full border-2 border-foxia-300"
              />
              <div>
                <p className="font-semibold">Sarah Jenkins</p>
                <p className="text-sm text-foxia-100">CEO, Sparkle Creative</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right form panel */}
        <div className="w-full lg:w-1/2 bg-white flex items-center justify-center p-6 lg:p-12 overflow-y-auto">
          <div className="w-full max-w-md space-y-8 animate-slide-up">
            <div className="text-center lg:text-left space-y-2">
              <h2 className="text-3xl font-bold text-slate-900">
                Welcome back
              </h2>
              <p className="text-slate-500">
                Please enter your details to sign in.
              </p>
            </div>

            <FlowMessages messages={errorMessages} />

            <div className="space-y-4">
              {flow ? (
                <FlowRenderer flow={flow} onSubmit={handleSubmit} />
              ) : (
                <p className="text-sm text-slate-500">Đang khởi tạo flow...</p>
              )}
            </div>

            <p className="text-center text-sm text-slate-500">
              Don&apos;t have an account?{" "}
              <button
                type="button"
                className="font-semibold text-foxia-600 hover:text-foxia-500 underline underline-offset-2"
                onClick={() =>
                  navigate({
                    to: "/registration",
                    search: { flow: undefined },
                  })
                }
              >
                Create free account
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
