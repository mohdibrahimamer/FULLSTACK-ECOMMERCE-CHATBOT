import React from "react";
import { FaCartPlus, FaSearch } from "react-icons/fa";
import { FaUser } from "react-icons/fa";
import { FaHeart } from "react-icons/fa";
import ChatWidget from "../chat-widget/ChatWidget";
const EcommerceStore = () => {
  return (
    <>
      <div>EcommerceStore</div>
      <div className="header">
        <div className="container">
          <div className="top-bar"></div>
          <div className="logo"></div>
          <div className="search-bar">
            <input type="text" placeholder="Search for products" />
            <button>
              <FaSearch /> search
            </button>
          </div>
        </div>
        {/*creating a navbar icons  */}
        <div className="navbar-icons">
          <a href="#account">
            <FaUser /> your account
          </a>

          <a href="#wishlist">
            <FaHeart />
            <span className="badge">your wishlist{3}</span>
          </a>

          <a href="#cart">
            <FaCartPlus />
            <span className="cart">your cart{2} </span>
          </a>
        </div>
        {/* creating a navabar */}
        <nav className="nav-bar">
          <ul>
            <li>
              <a href="#home">home</a>
            </li>
            <li>
              <a href="#electronics">electronics</a>
            </li>
            <li>
              <a href="#clothing">#clothing</a>
            </li>
            <li>
              <a href="#home-kitchen">#home and kitchen</a>
            </li>
            <li>
              <a href="#beauty">beauty</a>
            </li>
            <li>
              <a href="#sports">sports</a>
            </li>

            <li>
              <a href="#deals">deals</a>
            </li>
          </ul>
        </nav>

        {/* creating a main content */}
        <main>
          <div className="hero">
            <div className="container">
              <h1>summer sale is live</h1>
              <p>get up to 70% off on all selected items.limited time offer</p>
              <button>shop now</button>
            </div>
          </div>
        </main>
      </div>

      {/* creating a footer */}
      <footer className="footer">
        <div className="container">
          <div className="footer-content">
            <div className="footer-column1">
              <h3>shop</h3>
              <ul>
                <li>
                  <a href="#home">home</a>
                </li>
                <li>
                  <a href="#electronics">electronics</a>
                </li>
                <li>
                  <a href="#clothing">#clothing</a>
                </li>
                <li>
                  <a href="#home-kitchen">#home and kitchen</a>
                </li>
                <li>
                  <a href="#beauty">beauty</a>
                </li>
                <li>
                  <a href="#sports">sports</a>
                </li>

                <li>
                  <a href="#deals">deals</a>
                </li>
              </ul>
            </div>

            <div className="footer-column2">
              <h3>customer service</h3>
              <ul>
                <li>
                  <a href="#contactus">contactus</a>
                </li>
                <li>
                  <a href="#faqs">faqs</a>
                </li>
                <li>
                  <a href="#shipping-policy">#shipping-policy</a>
                </li>
                <li>
                  <a href="#returns-exchanges">returns and exchanges</a>
                </li>
                <li>
                  <a href="#order-tracking">order tracking</a>
                </li>
              </ul>
            </div>

            <div className="footer-column3">
              <span>about us</span>
              <ul>
                <li>
                  <a href="#ourstory">our story</a>
                </li>
                <li>
                  <a href="#blog">blog</a>
                </li>
                <li>
                  <a href="#careers">careers</a>
                </li>
                <li>
                  <a href="#press">press</a>
                </li>
                <li>
                  <a href="#sustainability">sustainability</a>
                </li>
              </ul>
            </div>

            <div className="footer-column4">
              <h3>connect with us</h3>
              <ul>
                <li>
                  <a href="#facebook">facebook</a>
                </li>
                <li>
                  <a href="#linkedin">linkedin</a>
                </li>
                <li>
                  <a href="#instagram">#instagram</a>
                </li>
                <li>
                  <a href="#twitter">twitter</a>
                </li>
                <li>
                  <a href="#beauty">beauty</a>
                </li>
                <li>
                  <a href="#pinterest">pinterest</a>
                </li>

                <li>
                  <a href="#youtube">youtube</a>
                </li>
              </ul>
            </div>
          </div>
          <div className="footer-bottom">
            <p>&copy; 2023 E-commerce Store. All rights reserved.</p>
          </div>
        </div>
      </footer>

      <ChatWidget />
    </>
  );
};

export default EcommerceStore;
