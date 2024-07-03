import axiosService from "../axiosService";

export const getPublicIP = async () => {
    const response = await axiosService.get("https://api.ipify.org?format=json");
    if (response.data.ip) {
        return response.data.ip;
    }
    return;
};
