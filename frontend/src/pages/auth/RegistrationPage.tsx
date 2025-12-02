import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { message } from "antd";
import { FlowRenderer } from "../../components/flow/FlowRenderer";
import { FlowMessages } from "../../components/flow/FlowMessages";
import { KratosFlow, UiText } from "../../types/kratos";
import {
  useCreateLoginFlow,
  useCreateRegistrationFlow,
  useSessionQuery,
  useSubmitLoginFlow,
  useSubmitRegistrationFlow,
} from "../../queries/auth.query";
import {
  extractFlowFromError,
  extractErrorMessage,
  isCsrfError,
  clearCookies,
} from "../../utils/kratos";

export default function RegistrationPage() {
  const navigate = useNavigate();
  const [messageApi, contextHolder] = message.useMessage();
  const [flow, setFlow] = useState<KratosFlow | null>(null);
  const [errorMessages, setErrorMessages] = useState<UiText[]>([]);

  const createFlowMutation = useCreateRegistrationFlow();
  const submitFlowMutation = useSubmitRegistrationFlow();
  const createLoginFlowMutation = useCreateLoginFlow();
  const submitLoginFlowMutation = useSubmitLoginFlow();
  const sessionQuery = useSessionQuery(false);
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
    }
  }, [createFlowMutation]);

  useEffect(() => {
    if (hasInitialized.current) {
      return;
    }

    hasInitialized.current = true;
    setErrorMessages([]);
    initializeFlow();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const autoLoginAfterRegistration = useCallback(
    async (email: string, password: string) => {
      if (!email || !password) {
        return;
      }

      try {
        messageApi.success("Tạo tài khoản thành công! Đang đăng nhập...");
        const loginFlowResponse = await createLoginFlowMutation.mutateAsync(
          undefined
        );
        const loginFlow: KratosFlow =
          ((loginFlowResponse as any)?.data as KratosFlow) ??
          (loginFlowResponse as KratosFlow);

        const csrfNode = loginFlow.ui.nodes.find(
          (node) => node.attributes.name === "csrf_token"
        );
        const csrfToken = csrfNode?.attributes.value as string | undefined;

        if (!csrfToken) {
          throw new Error("Không tìm thấy CSRF token cho login flow");
        }

        await submitLoginFlowMutation.mutateAsync({
          flowId: loginFlow.id,
          payload: {
            identifier: email,
            password,
            method: "password",
            csrf_token: csrfToken,
          },
        });

        await sessionQuery.refetch();
        navigate({ to: "/me" });
      } catch (error) {
        console.error("Auto login after registration failed:", error);
        messageApi.error(
          "Đăng ký thành công nhưng đăng nhập tự động thất bại. Vui lòng đăng nhập thủ công."
        );
        navigate({ to: "/login" });
      }
    },
    [
      createLoginFlowMutation,
      submitLoginFlowMutation,
      sessionQuery,
      navigate,
      messageApi,
    ]
  );

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

      await autoLoginAfterRegistration(
        String(payload["traits.email"] ?? ""),
        String(payload.password ?? "")
      );
      return;
    } catch (error) {
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
    <>
      {contextHolder}
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
                “Create your Foxia workspace in minutes and launch with
                confidence. Seamless onboarding for every team.”
              </blockquote>
              <div className="flex items-center gap-4 mt-6">
                <img
                  src="https://randomuser.me/api/portraits/men/32.jpg"
                  alt="User"
                  className="w-12 h-12 rounded-full border-2 border-foxia-300"
                />
                <div>
                  <p className="font-semibold">David Green</p>
                  <p className="text-sm text-foxia-100">COO, Northwind Labs</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right form panel */}
          <div className="w-full lg:w-1/2 bg-white flex items-center justify-center p-6 lg:p-12 overflow-y-auto">
            <div className="w-full max-w-md space-y-8 animate-slide-up">
              <div className="text-center lg:text-left space-y-2">
                <h2 className="text-3xl font-bold text-slate-900">
                  Create your account
                </h2>
                <p className="text-slate-500">
                  Start with your email and password to access Foxia.
                </p>
              </div>

              <FlowMessages messages={errorMessages} />

              <div className="space-y-4">
                {flow ? (
                  <FlowRenderer
                    showPasswordStrength={true}
                    flow={flow}
                    onSubmit={handleSubmit}
                  />
                ) : createFlowMutation.isPending ? (
                  <p className="text-sm text-slate-500">
                    Đang khởi tạo flow...
                  </p>
                ) : createFlowMutation.isError ? (
                  <p className="text-sm text-red-600">
                    Lỗi khi khởi tạo flow. Vui lòng thử lại.
                  </p>
                ) : (
                  <p className="text-sm text-slate-500">
                    Đang khởi tạo flow...
                  </p>
                )}
              </div>

              <p className="text-xs text-center text-slate-400">
                By creating an account, you agree to Foxia&apos;s Terms &
                Privacy Policy.
              </p>

              <p className="text-center text-sm text-slate-500">
                Already have an account?{" "}
                <button
                  type="button"
                  className="font-semibold text-foxia-600 hover:text-foxia-500 underline underline-offset-2"
                  onClick={() => navigate({ to: "/login" })}
                >
                  Log in
                </button>
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
