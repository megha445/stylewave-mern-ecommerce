import { UserProfile } from "@clerk/react";
import { useNavigate } from "react-router-dom";
import Title from "../components/Title";

const ChangePassword = () => {
  const navigate = useNavigate();

  return (
    <div className="border-t pt-16 max-w-2xl mx-auto">
      <div className="text-2xl mb-8">
        <Title text1={"ACCOUNT"} text2={"SETTINGS"} />
      </div>

      <UserProfile routing="hash" />

      <button
        type="button"
        onClick={() => navigate("/profile")}
        className="mt-8 bg-gray-200 text-gray-800 px-8 py-3 rounded-md hover:bg-gray-300"
      >
        Back to Profile
      </button>
    </div>
  );
};

export default ChangePassword;
