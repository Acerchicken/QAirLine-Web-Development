import React from 'react';
import { useRouter } from 'next/navigation';
import { format, parse } from 'date-fns';
import styles from './styles/SearchBar.module.css';

interface SearchProps {
    search: {
        startDestination: string;
        arriveDestination: string;
        startDate: string;
        arriveDate: string;
        startDestinationOptions: string[];
        arriveDestinationOptions: string[];
    };
    handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
    handleSearch: () => void;
    quickSearchBar?: boolean;
}

const SearchBar: React.FC<SearchProps> = ({ search, handleInputChange, handleSearch, quickSearchBar = true }) => {
    const router = useRouter();

    // Hàm xử lý query và chuyển hướng
    const executeSearch = () => {
         // Gọi hàm xử lý logic tìm
        if (quickSearchBar) {
            // Chuyển hướng với query params
            const query = new URLSearchParams({
                startDestination: search.startDestination || '',
                arriveDestination: search.arriveDestination || '',
                startDate: search.startDate || '',
                arriveDate: search.arriveDate || '',
            }).toString();
            router.push(`/bookings/search?${query}`);
        }
        handleSearch();
    };
    // Hàm xử lý khi nhấn phím Enter
    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement | HTMLSelectElement>) => {
        if (e.key === 'Enter') {
            executeSearch();
        }
    };


    return (
        <div className={styles.container}>
            <div className={styles.searchbar}>
                <select
                    name="startDestination"
                    value={search.startDestination}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyDown}
                >
                    <option value="">Start Destination</option>
                    {search.startDestinationOptions.map((option) => (
                        <option key={option} value={option}>
                            {option}
                        </option>
                    ))}
                </select>
                <select
                    name="arriveDestination"
                    value={search.arriveDestination}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyDown}
                >
                    <option value="">Arrive Destination</option>
                    {search.arriveDestinationOptions.map((option) => (
                        <option key={option} value={option}>
                            {option}
                        </option>
                    ))}
                </select>
                <input
                    type="date"
                    name="startDate"
                    placeholder="Start Date"
                    value={search.startDate}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyDown}
                />
                <input
                    type="date"
                    name="arriveDate"
                    placeholder="Arrive Date"
                    value={search.arriveDate}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyDown}
                />
                {/* Conditional rendering of button */}
                <button className={styles.searchButton} onClick={executeSearch}>Search</button>
            </div>

        </div>
    );
};

export default SearchBar;