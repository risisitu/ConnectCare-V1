import { useModal } from "../../hooks/useModal";
import { useProfileData } from "../../hooks/useProfileData";
import { useState, useEffect } from "react";
import { Modal } from "../ui/modal";
import Button from "../ui/button/Button";
import Input from "../form/input/InputField";
import Label from "../form/Label";

export default function ProfessionalInfoCard() {
  const { isOpen, openModal, closeModal } = useModal();
  const { profile, loading, error, updateProfile } = useProfileData();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [specialization, setSpecialization] = useState("");
  const [experienceYears, setExperienceYears] = useState<number | "">("");
  const [clinicAddress, setClinicAddress] = useState("");

  useEffect(() => {
    if (profile && "specialization" in profile) {
      setFirstName(profile.first_name || "");
      setLastName(profile.last_name || "");
      setPhoneNumber((profile as any).phone_number || "");
      setSpecialization((profile as any).specialization || "");
      setExperienceYears((profile as any).experience_years ?? "");
      setClinicAddress((profile as any).clinic_address || "");
    }
  }, [profile]);

  const handleSave = async () => {
    if (!profile) return;
    const payload = {
      firstName,
      lastName,
      phoneNumber,
      specialization,
      clinicAddress,
      experienceYears: experienceYears === "" ? null : Number(experienceYears),
      profileImage: (profile as any).profile_image || "",
    };
    const res = await updateProfile(payload);
    if (res.success) closeModal();
    else console.error("Update failed:", res.error);
  };

  if (loading || error || !profile) {
    return null;
  }

  const isDoctor = "specialization" in profile;

  if (!isDoctor) {
    return null;
  }

  return (
    <div className="p-5 border border-gray-200 rounded-2xl dark:border-gray-800 lg:p-6 mt-6">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h4 className="text-lg font-semibold text-gray-800 dark:text-white/90 lg:mb-6">Professional Information</h4>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-7 2xl:gap-x-32">


            <div>
              <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">Specialization</p>
              <p className="text-sm font-medium text-gray-800 dark:text-white/90">{(profile as any).specialization}</p>
            </div>

            <div>
              <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">Experience (Years)</p>
              <p className="text-sm font-medium text-gray-800 dark:text-white/90">{(profile as any).experience_years}</p>
            </div>

            <div className="lg:col-span-2">
              <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">Clinic Address</p>
              <p className="text-sm font-medium text-gray-800 dark:text-white/90">{(profile as any).clinic_address}</p>
            </div>
          </div>
        </div>

        <button onClick={openModal} className="flex w-full items-center justify-center gap-2 rounded-full border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 hover:text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] dark:hover:text-gray-200 lg:inline-flex lg:w-auto">
          Edit
        </button>
      </div>

      <Modal isOpen={isOpen} onClose={closeModal} className="max-w-[700px] m-4">
        <div className="no-scrollbar relative w-full max-w-[700px] overflow-y-auto rounded-3xl bg-white p-4 dark:bg-gray-900 lg:p-11">
          <div className="px-2 pr-14">
            <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">Edit Professional Information</h4>
            <p className="mb-6 text-sm text-gray-500 dark:text-gray-400 lg:mb-7">Update professional details.</p>
          </div>
          <form className="flex flex-col">
            <div className="custom-scrollbar h-[450px] overflow-y-auto px-2 pb-3">
              <div>
                <div className="grid grid-cols-1 gap-x-6 gap-y-5 lg:grid-cols-2">


                  <div className="col-span-2 lg:col-span-1">
                    <Label>Specialization</Label>
                    <Input type="text" value={specialization} onChange={(e) => setSpecialization(e.target.value)} />
                  </div>

                  <div className="col-span-2 lg:col-span-1">
                    <Label>Experience (Years)</Label>
                    <Input type="number" value={experienceYears?.toString() || ""} onChange={(e) => setExperienceYears(e.target.value ? Number(e.target.value) : "")} />
                  </div>

                  <div className="col-span-2">
                    <Label>Clinic Address</Label>
                    <Input type="text" value={clinicAddress} onChange={(e) => setClinicAddress(e.target.value)} />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 px-2 mt-6 lg:justify-end">
              <Button size="sm" variant="outline" onClick={closeModal}>Close</Button>
              <Button size="sm" onClick={handleSave}>Save Changes</Button>
            </div>
          </form>
        </div>
      </Modal>
    </div>
  );
}
