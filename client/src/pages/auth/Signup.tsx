import { useState } from "react";
import { useSignup } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/common/Button";
import { Archive, AlertTriangle } from "lucide-react";

const levelOptions = [
  "100 Level",
  "200 Level",
  "300 Level",
  "400 Level",
  "500 Level",
  "Postgraduate",
];

export default function Signup() {
  const signup = useSignup();
  const [, setLocation] = useLocation();

  const [formData, setFormData] = useState({
    uniqueId: "",
    password: "",
    name: "",
    accountType: "Student" as "Student" | "Staff",
    level: "",
    idCardImage: "",
  });
  const [error, setError] = useState("");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      setFormData((prev) => ({ ...prev, idCardImage: "" }));
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setFormData((prev) => ({
        ...prev,
        idCardImage: String(reader.result || ""),
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (formData.accountType === "Student" && !formData.level.trim()) {
      setError("Please provide your current level for a student account.");
      return;
    }

    if (!formData.idCardImage) {
      setError(
        "Please upload a valid ID card image before creating your account.",
      );
      return;
    }

    signup.mutate(formData, {
      onSuccess: () => {
        setLocation("/login");
      },
      onError: (err) => {
        setError(err.message);
      },
    });
  };

  return (
    <div className="min-h-screen bg-[#0A2240] flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-1/2 h-1/2 rounded-full bg-[#1A6BAF] blur-[100px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-1/2 h-1/2 rounded-full bg-[#C8A84B] blur-[120px]"></div>
      </div>

      <div className="w-full max-w-md bg-card rounded-xl shadow-2xl p-8 relative z-10 border border-border/50">
        <div className="flex flex-col items-center mb-8">
          <div className="h-16 w-16 bg-[#0A2240] rounded-lg flex items-center justify-center mb-4 shadow-inner">
            <Archive className="h-8 w-8 text-[#C8A84B]" />
          </div>
          <h1 className="text-2xl font-bold text-foreground text-center">
            Create Account
          </h1>
          <p className="text-muted-foreground mt-2 text-sm text-center">
            Provide your details to request access to the ICT Department
            E-Archive
          </p>
        </div>

        {error && (
          <div className="mb-6 p-3 bg-destructive/10 border border-destructive/20 rounded-md flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
            <p className="text-sm text-destructive font-medium leading-tight">
              {error}
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label className="text-foreground font-semibold">
              Account Type
            </Label>
            <Select
              value={formData.accountType}
              onValueChange={(value: "Student" | "Staff") =>
                setFormData((prev) => ({
                  ...prev,
                  accountType: value,
                  level: value === "Staff" ? "" : prev.level,
                }))
              }
            >
              <SelectTrigger className="h-11 border-border focus-visible:ring-[#1A6BAF] bg-background">
                <SelectValue placeholder="Select account type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Student">Student</SelectItem>
                <SelectItem value="Staff">Staff</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="uniqueId" className="text-foreground font-semibold">
              {formData.accountType === "Staff"
                ? "Staff ID"
                : "Student Matric Number"}
            </Label>
            <Input
              id="uniqueId"
              placeholder={
                formData.accountType === "Staff"
                  ? "e.g. SS/CE/0061"
                  : "e.g. U22CE1210"
              }
              value={formData.uniqueId}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, uniqueId: e.target.value }))
              }
              className="h-11 border-border focus-visible:ring-[#1A6BAF] bg-background"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-foreground font-semibold">
              Preferred Password
            </Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={formData.password}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, password: e.target.value }))
              }
              className="h-11 border-border focus-visible:ring-[#1A6BAF] bg-background"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="name" className="text-foreground font-semibold">
              Full Name (as shown on ID card)
            </Label>
            <Input
              id="name"
              placeholder="Your full legal name"
              value={formData.name}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, name: e.target.value }))
              }
              className="h-11 border-border focus-visible:ring-[#1A6BAF] bg-background"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="level" className="text-foreground font-semibold">
              Current Level{" "}
              {formData.accountType === "Staff" ? "(students only)" : ""}
            </Label>
            <Input
              id="level"
              list="level-options"
              placeholder={
                formData.accountType === "Staff"
                  ? "Not required for staff accounts"
                  : "Select or type your current level"
              }
              value={formData.level}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, level: e.target.value }))
              }
              className="h-11 border-border focus-visible:ring-[#1A6BAF] bg-background"
              required={formData.accountType === "Student"}
              disabled={formData.accountType === "Staff"}
            />
            <datalist id="level-options">
              {levelOptions.map((level) => (
                <option key={level} value={level} />
              ))}
            </datalist>
          </div>

          <div className="space-y-2">
            <Label
              htmlFor="idCardImage"
              className="text-foreground font-semibold"
            >
              Picture of ID Card
            </Label>
            <Input
              id="idCardImage"
              type="file"
              accept="image/*"
              className="h-11 border-border focus-visible:ring-[#1A6BAF] bg-background"
              onChange={handleFileChange}
              required
            />
          </div>

          <Button
            type="submit"
            className="w-full h-11 text-base font-bold bg-[#1A6BAF] hover:bg-[#0D3060] text-white mt-4"
            isLoading={signup.isPending}
          >
            {signup.isPending ? "Creating Account..." : "Create Account"}
          </Button>

          <p className="text-sm text-center text-muted-foreground">
            Already registered with this ID number?{" "}
            <button
              type="button"
              onClick={() => setLocation("/login")}
              className="text-[#1A6BAF] hover:underline font-semibold"
            >
              Sign in
            </button>
          </p>
        </form>

        <div className="mt-8 text-center text-xs text-muted-foreground">
          <p>
            &copy; {new Date().getFullYear()} Air Force Institute of Technology.
            All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}
