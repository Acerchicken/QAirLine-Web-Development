'use client'
import style from "./homepage.module.css";
import React, { useState } from "react";
import "@/app/global/global.css";
import SearchBar from "@/app/components/SearchBar";


export default function Home() {
  const [search, setSearch] = useState({
    startDestination: '',
    arriveDestination: '',
    startDate: '',
    arriveDate: '',
    startDestinationOptions: ['New York (JFK)', 'Chicago (ORD)', 'San Francisco (SFO)'],
    arriveDestinationOptions: ['Los Angeles (LAX)', 'Miami (MIA)', 'Seattle (SEA)'],
  });

  const handleInputChange = (e: any) => {
      const { name, value } = e.target;
      setSearch((prev) => ({ ...prev, [name]: value }));
  };

  const handleSearch = () => {
      console.log(search);
  };

  return (
      <main>
          <div className={style.welcome}>
              Welcome to Cloud Airlines!
          </div>
          <div className={style.main_image}>
              <img src="Placeholder/image_mainpage.png" alt="Main image"></img>
          </div>

          <div className="searchBar">
              <h1 className="text-center font-bold mb-4 text-lg">----------Book Flights----------</h1>
              <SearchBar
                  search={search}
                  handleInputChange={handleInputChange}
                  handleSearch={handleSearch}
                  quickSearchBar={true}
              />
          </div>

          <div className="offers">
              <h1 className="text-center font-bold mb-4 text-lg">----------Offers----------</h1>

          </div>

          <div className={style.hotDes}>
              <h1 className="text-center font-bold mb-4 text-lg">----------Hot Destination----------</h1>
              <div className={style.destinations}>
                  <div className={style.destinationCard}>
                      <img src="Placeholder/HaLongBay.png" alt="Halong Bay, Vietnam"/>
                      <div className={style.destinationInfo}>Halong Bay, Vietnam</div>
                  </div>
                  <div className={style.destinationCard}>
                      <img src="Placeholder/HaNoi.png" alt="Hanoi, Vietnam"/>
                      <div className={style.destinationInfo}>Hanoi, Vietnam</div>
                  </div>
                  <div className={style.destinationCard}>
                      <img src="Placeholder/DaNang.png" alt="Danang, Vietnam"/>
                      <div className={style.destinationInfo}>Danang, Vietnam</div>
                  </div>
              </div>
          </div>
      </main>
  );
}
