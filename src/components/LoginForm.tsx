
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useUser } from "@/context/UserContext";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const loginSchema = z.object({
  username: z.string().min(1, { message: "유저 이름을 입력해 주세요" }),
  password: z.string().min(1, { message: "비밀번호를 입력해 주세요" }),
});

type LoginValues = z.infer<typeof loginSchema>;

// Type for the login response
type LoginResponse = {
  success: boolean;
  user?: {
    id?: string;
    username?: string;
    nickname?: string;
  };
  message?: string;
};

export default function LoginForm() {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { switchUser } = useUser();
  const navigate = useNavigate();

  const form = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  async function onSubmit(values: LoginValues) {
    setIsLoading(true);
    try {
      console.log("Attempting login with:", values.username);
      
      // Special handling for admin account
      if (values.username === 'admin' && values.password === 'admin0109') {
        // Direct admin login without checking database
        await switchUser('admin');
        
        toast({
          title: "관리자 로그인 성공",
          description: "관리자 대시보드로 이동합니다.",
        });
        
        navigate('/');
        setIsLoading(false);
        return;
      }
      
      const { data, error } = await supabase.rpc('basic_login', {
        username_input: values.username,
        password_input: values.password
      });

      if (error) {
        console.error("Login error from RPC:", error);
        toast({
          title: "로그인 실패",
          description: "서버 오류가 발생했습니다. 다시 시도해 주세요.",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      // Parse the JSON result if it's a string
      const result: LoginResponse = typeof data === 'string' ? JSON.parse(data) : data;
      console.log("Login result:", result);
      
      if (!result.success) {
        toast({
          title: "로그인 실패",
          description: "아이디 또는 비밀번호가 일치하지 않습니다.",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      // Login successful, switch to this user
      if (result.user && result.user.username) {
        await switchUser(result.user.username);
        
        toast({
          title: "로그인 성공",
          description: `${result.user?.nickname || result.user?.username}님 환영합니다!`,
        });
        
        // Redirect to home page after successful login
        navigate('/');
      } else {
        console.error("Missing user information in response:", result);
        toast({
          title: "로그인 오류",
          description: "사용자 정보를 가져오는데 실패했습니다.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Login error:", error);
      toast({
        title: "로그인 오류",
        description: "로그인 중 오류가 발생했습니다. 다시 시도해 주세요.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="space-y-6 max-w-sm mx-auto">
      <div className="space-y-2 text-center">
        <h1 className="text-3xl font-bold">로그인</h1>
        <p className="text-gray-500 dark:text-gray-400">
          아이디와 비밀번호를 입력해 주세요
        </p>
      </div>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="username"
            render={({ field }) => (
              <FormItem>
                <FormLabel>아이디</FormLabel>
                <FormControl>
                  <Input placeholder="아이디" {...field} />
                </FormControl>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>비밀번호</FormLabel>
                <FormControl>
                  <Input type="password" placeholder="비밀번호" {...field} />
                </FormControl>
              </FormItem>
            )}
          />
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "로그인 중..." : "로그인"}
          </Button>
        </form>
      </Form>
    </div>
  );
}
