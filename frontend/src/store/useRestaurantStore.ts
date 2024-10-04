import { Orders } from "@/types/orderType";
import { MenuItem, RestaurantState } from "@/types/restaurantType";
import axios from "axios";
import { toast } from "sonner";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

const API_END_POINT = "http://localhost:5000/api/v1/restaurant";
axios.defaults.withCredentials = true; // set withCredential true for all at once for all the headers used allow cookies to be included with your requests.

export const useRestaurantStore = create<RestaurantState>()(persist((set, get) => ({
    loading: false,
    restaurant: null,
    searchedRestaurant: null,
    appliedFilter: [],
    singleRestaurant: null,
    restaurantOrder: [],
    createRestaurant: async (formData: FormData) => {
        try {
            set({ loading: true });
            const response = await axios.post(`${API_END_POINT}/`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });
            if (response.data.success) {
                toast.success(response.data.message);
                set({ loading: false });
            }
        } catch (error: any) {
            toast.error(error.response.data.message);
            set({ loading: false });
        }
    },
    getRestaurant: async () => {
        try {
            set({ loading: true });
            const response = await axios.get(`${API_END_POINT}/`);
            console.log(response.data)
            if (response.data.success) {
                set({ loading: false, restaurant: response.data.restaurant });
            }
        } catch (error: any) {
            if (error.response.status === 404) {
                set({ restaurant: null });
            }
            set({ loading: false });
        }
    },
    updateRestaurant: async (formData: FormData) => {
        try {
            set({ loading: true });
            const response = await axios.put(`${API_END_POINT}/`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });
            if (response.data.success) {
                toast.success(response.data.message);
                set({ loading: false });
            }
        } catch (error: any) {
            toast.error(error.response.data.message);
            set({ loading: false });
        }
    },
    searchRestaurant: async (searchText: string, searchQuery: string, selectedCuisines: any) => {
        try {
            set({ loading: true });

            const params = new URLSearchParams();
            params.set("searchQuery", searchQuery);
            params.set("selectedCuisines", selectedCuisines.join(","));

            // await new Promise((resolve) => setTimeout(resolve, 2000));
            const response = await axios.get(`${API_END_POINT}/search/${searchText}?${params.toString()}`);
            if (response.data.success) {
                set({ loading: false, searchedRestaurant: response.data });
            }
        } catch (error) {
            set({ loading: false });
        }
    },

    // responsible for adding menus of the selected restaurant just when the menu gets created by the user
    addMenuToRestaurant: (menu: MenuItem) => {
        set((state: any) => ({ // state indicates all the variables of the useRestaurantStore like loading,restaurant and etc
            restaurant: state.restaurant ? { ...state.restaurant, menus: [...state.restaurant.menus, menu] } : null, //checking if the restaurant exists or not and if exists destructring the value of restaurant and keeping as it is and then adding the current state or value of the menus
        }))
    },
    updateMenuToRestaurant: (updatedMenu: MenuItem) => {
        set((state: any) => {
            
            if (state.restaurant) {
                const updatedMenuList = state.restaurant.menus.map((menu: any) => menu._id === updatedMenu._id ? updatedMenu : menu);
                return {
                    restaurant: {
                        ...state.restaurant,
                        menus: updatedMenuList
                    }
                }
            }
            // if state.restaruant is undefined then return state
            return state;
        })
    },

    // side filter set or unset check 
    setAppliedFilter: (value: string) => {
        set((state) => {
            const isAlreadyApplied = state.appliedFilter.includes(value); // check if there is any value selected
            const updatedFilter = isAlreadyApplied ? state.appliedFilter.filter((item) => item !== value) : [...state.appliedFilter, value]; // if the filter is checked the it will uncheck or unselect the value and if not select/checks the value
            return { appliedFilter: updatedFilter }
        })
    },
    resetAppliedFilter: () => {
        set({ appliedFilter: [] })
    },
    getSingleRestaurant: async (restaurantId: string) => {
        try {
            const response = await axios.get(`${API_END_POINT}/${restaurantId}`);
            if (response.data.success) {
                set({ singleRestaurant: response.data.restaurant })
            }
        } catch (error) { }
    },
    getRestaurantOrders: async () => {
        try {
            const response = await axios.get(`${API_END_POINT}/order`);
            if (response.data.success) {
                set({ restaurantOrder: response.data.orders });
            }
        } catch (error) {
            console.log(error);
        }
    },
    updateRestaurantOrder: async (orderId: string, status: string) => {
        try {
            const response = await axios.put(`${API_END_POINT}/order/${orderId}/status`, { status }, {
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            if (response.data.success) {
                const updatedOrder = get().restaurantOrder.map((order: Orders) => {
                    return order._id === orderId ? { ...order, status: response.data.status } : order;
                })
                set({ restaurantOrder: updatedOrder });
                toast.success(response.data.message);
            }
        } catch (error: any) {
            toast.error(error.response.data.message);
        }
    }

}), {
    name: 'restaurant-name', //the name used to store the persisted data in the below given storage, basically a key name 
    storage: createJSONStorage(() => localStorage) // specifies where we want to store the persisted data, either in local storage or session storage
}))