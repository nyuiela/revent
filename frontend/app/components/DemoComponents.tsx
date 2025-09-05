"use client";

import { type ReactNode, useCallback, useMemo, useState } from "react";
import { useAccount } from "wagmi";
import {
   Transaction,
   TransactionButton,
   TransactionToast,
   TransactionToastAction,
   TransactionToastIcon,
   TransactionToastLabel,
   TransactionError,
   TransactionResponse,
   TransactionStatusAction,
   TransactionStatusLabel,
   TransactionStatus,
} from "@coinbase/onchainkit/transaction";
import { useNotification } from "@coinbase/onchainkit/minikit";

type ButtonProps = {
   children: ReactNode;
   variant?: "primary" | "secondary" | "outline" | "ghost";
   size?: "sm" | "md" | "lg";
   className?: string;
   onClick?: () => void;
   disabled?: boolean;
   type?: "button" | "submit" | "reset";
   icon?: ReactNode;
   loading?: boolean;
   loadingText?: string;
}

export function Button({
   children,
   variant = "primary",
   size = "md",
   className = "",
   onClick,
   disabled = false,
   type = "button",
   icon,
   loading = false,
   loadingText,
}: ButtonProps) {
   const baseClasses =
      "inline-flex items-center justify-center font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#0052FF] disabled:opacity-50 disabled:pointer-events-none";

   const variantClasses = {
      primary:
         "bg-[var(--app-accent)] hover:bg-[var(--app-accent-hover)] text-[var(--app-background)]",
      secondary:
         "bg-[var(--app-gray)] hover:bg-[var(--app-gray-dark)] text-[var(--app-foreground)]",
      outline:
         "border border-[var(--app-accent)] hover:bg-[var(--app-accent-light)] text-[var(--app-accent)]",
      ghost:
         "hover:bg-[var(--app-accent-light)] text-[var(--app-foreground-muted)]",
   };

   const sizeClasses = {
      sm: "text-xs px-2.5 py-1.5 rounded-md",
      md: "text-sm px-4 py-2 rounded-lg",
      lg: "text-base px-6 py-3 rounded-lg",
   };

   return (
      <button
         type={type}
         className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
         onClick={onClick}
         disabled={disabled || loading}
         aria-busy={loading}
      >
         {loading ? (
            <span className="flex items-center">
               <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
               </svg>
               <span>{loadingText || 'Processing...'}</span>
            </span>
         ) : (
            <>
               {icon && <span className="flex items-center mr-2">{icon}</span>}
               {children}
            </>
         )}
      </button>
   );
}

type CardProps = {
   title?: string;
   children: ReactNode;
   className?: string;
   onClick?: () => void;
}

export function Card({
   title,
   children,
   className = "",
   onClick,
}: CardProps) {
   const handleKeyDown = (e: React.KeyboardEvent) => {
      if (onClick && (e.key === "Enter" || e.key === " ")) {
         e.preventDefault();
         onClick();
      }
   };

   return (
      <div
         className={`bg-[var(--app-card-bg)] backdrop-blur-md rounded-xl shadow-lg border border-[var(--app-card-border)] overflow-hidden transition-all hover:shadow-xl ${className} ${onClick ? "cursor-pointer" : ""}`}
         onClick={onClick}
         onKeyDown={onClick ? handleKeyDown : undefined}
         tabIndex={onClick ? 0 : undefined}
         role={onClick ? "button" : undefined}
      >
         {title && (
            <div className="px-5 py-3 border-b border-[var(--app-card-border)]">
               <h3 className="text-lg font-medium text-[var(--app-foreground)]">
                  {title}
               </h3>
            </div>
         )}
         <div className="p-5">{children}</div>
      </div>
   );
}

type FeaturesProps = {
   setActiveTab: (tab: string) => void;
};

export function Features({ setActiveTab }: FeaturesProps) {
   return (
      <div className="space-y-6 animate-fade-in">
         <Card title="Key Features">
            <ul className="space-y-3 mb-4">
               <li className="flex items-start">
                  <Icon name="check" className="text-[var(--app-accent)] mt-1 mr-2" />
                  <span className="text-[var(--app-foreground-muted)]">
                     Minimalistic and beautiful UI design
                  </span>
               </li>
               <li className="flex items-start">
                  <Icon name="check" className="text-[var(--app-accent)] mt-1 mr-2" />
                  <span className="text-[var(--app-foreground-muted)]">
                     Responsive layout for all devices
                  </span>
               </li>
               <li className="flex items-start">
                  <Icon name="check" className="text-[var(--app-accent)] mt-1 mr-2" />
                  <span className="text-[var(--app-foreground-muted)]">
                     Dark mode support
                  </span>
               </li>
               <li className="flex items-start">
                  <Icon name="check" className="text-[var(--app-accent)] mt-1 mr-2" />
                  <span className="text-[var(--app-foreground-muted)]">
                     OnchainKit integration
                  </span>
               </li>
            </ul>
            <Button variant="outline" onClick={() => setActiveTab("home")}>
               Back to Home
            </Button>
         </Card>
      </div>
   );
}

type HomeProps = {
   setActiveTab: (tab: string) => void;
};

export function Home({ setActiveTab }: HomeProps) {
   return (
      <div className="space-y-6 animate-fade-in">
         <Card title="My First Mini App">
            <p className="text-[var(--app-foreground-muted)] mb-4">
               This is a minimalistic Mini App built with OnchainKit components.
            </p>
            <Button
               onClick={() => setActiveTab("features")}
               icon={<Icon name="arrow-right" size="sm" />}
            >
               Explore Features
            </Button>
         </Card>

         <TodoList />

         <TransactionCard />
      </div>
   );
}

type IconProps = {
   name: "heart" | "star" | "check" | "plus" | "arrow-right" | "arrow-left" | "calendar" | "map-pin" | "users" | "home" | "share" | "x" | "camera";
   size?: "sm" | "md" | "lg";
   className?: string;
}

export function Icon({ name, size = "md", className = "" }: IconProps) {
   const sizeClasses = {
      sm: "w-4 h-4",
      md: "w-5 h-5",
      lg: "w-6 h-6",
   };

   const icons = {
      heart: (
         <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
         >
            <title>Heart</title>
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
         </svg>
      ),
      star: (
         <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
         >
            <title>Star</title>
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
         </svg>
      ),
      check: (
         <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
         >
            <title>Check</title>
            <polyline points="20 6 9 17 4 12" />
         </svg>
      ),
      plus: (
         <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
         >
            <title>Plus</title>
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
         </svg>
      ),
      "arrow-right": (
         <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
         >
            <title>Arrow Right</title>
            <line x1="5" y1="12" x2="19" y2="12" />
            <polyline points="12 5 19 12 12 19" />
         </svg>
      ),
      "arrow-left": (
         <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
         >
            <title>Arrow Left</title>
            <line x1="19" y1="12" x2="5" y2="12" />
            <polyline points="12 19 5 12 12 5" />
         </svg>
      ),
      calendar: (
         <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
         >
            <title>Calendar</title>
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
         </svg>
      ),
      "map-pin": (
         <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
         >
            <title>Map Pin</title>
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
            <circle cx="12" cy="10" r="3" />
         </svg>
      ),
      users: (
         <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
         >
            <title>Users</title>
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
         </svg>
      ),
      home: (
         <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
         >
            <title>Home</title>
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            <polyline points="9 22 9 12 15 12 15 22" />
         </svg>
      ),
      share: (
         <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
         >
            <title>Share</title>
            <circle cx="18" cy="5" r="3" />
            <circle cx="6" cy="12" r="3" />
            <circle cx="18" cy="19" r="3" />
            <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
            <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
         </svg>
      ),
      x: (
         <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
         >
            <title>X</title>
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
         </svg>
      ),
      camera: (
         <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
         >
            <title>Camera</title>
            <path d="M23 19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h3l3-3h4l3 3h3a2 2 0 0 1 2 2z" />
            <circle cx="12" cy="10" r="3" />
         </svg>
      ),
   };

   return (
      <span className={`inline-block ${sizeClasses[size]} ${className}`}>
         {icons[name]}
      </span>
   );
}

type Todo = {
   id: number;
   text: string;
   completed: boolean;
}

function TodoList() {
   const [todos, setTodos] = useState<Todo[]>([
      { id: 1, text: "Learn about MiniKit", completed: false },
      { id: 2, text: "Build a Mini App", completed: true },
      { id: 3, text: "Deploy to Base and go viral", completed: false },
   ]);
   const [newTodo, setNewTodo] = useState("");

   const addTodo = () => {
      if (newTodo.trim() === "") return;

      const newId =
         todos.length > 0 ? Math.max(...todos.map((t) => t.id)) + 1 : 1;
      setTodos([...todos, { id: newId, text: newTodo, completed: false }]);
      setNewTodo("");
   };

   const toggleTodo = (id: number) => {
      setTodos(
         todos.map((todo) =>
            todo.id === id ? { ...todo, completed: !todo.completed } : todo,
         ),
      );
   };

   const deleteTodo = (id: number) => {
      setTodos(todos.filter((todo) => todo.id !== id));
   };

   const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === "Enter") {
         addTodo();
      }
   };

   return (
      <Card title="Get started">
         <div className="space-y-4">
            <div className="flex items-center space-x-2">
               <input
                  type="text"
                  value={newTodo}
                  onChange={(e) => setNewTodo(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Add a new task..."
                  className="flex-1 px-3 py-2 bg-[var(--app-card-bg)] border border-[var(--app-card-border)] rounded-lg text-[var(--app-foreground)] placeholder-[var(--app-foreground-muted)] focus:outline-none focus:ring-1 focus:ring-[var(--app-accent)]"
               />
               <Button
                  variant="primary"
                  size="md"
                  onClick={addTodo}
                  icon={<Icon name="plus" size="sm" />}
               >
                  Add
               </Button>
            </div>

            <ul className="space-y-2">
               {todos.map((todo) => (
                  <li key={todo.id} className="flex items-center justify-between">
                     <div className="flex items-center space-x-2">
                        <button
                           type="button"
                           id={`todo-${todo.id}`}
                           onClick={() => toggleTodo(todo.id)}
                           className={`w-5 h-5 rounded-full border flex items-center justify-center ${todo.completed
                              ? "bg-[var(--app-accent)] border-[var(--app-accent)]"
                              : "border-[var(--app-foreground-muted)] bg-transparent"
                              }`}
                        >
                           {todo.completed && (
                              <Icon
                                 name="check"
                                 size="sm"
                                 className="text-[var(--app-background)]"
                              />
                           )}
                        </button>
                        <label
                           htmlFor={`todo-${todo.id}`}
                           className={`text-[var(--app-foreground-muted)] cursor-pointer ${todo.completed ? "line-through opacity-70" : ""}`}
                        >
                           {todo.text}
                        </label>
                     </div>
                     <button
                        type="button"
                        onClick={() => deleteTodo(todo.id)}
                        className="text-[var(--app-foreground-muted)] hover:text-[var(--app-foreground)]"
                     >
                        ×
                     </button>
                  </li>
               ))}
            </ul>
         </div>
      </Card>
   );
}


function TransactionCard() {
   const { address } = useAccount();

   // Example transaction call - sending 0 ETH to self
   const calls = useMemo(() => address
      ? [
         {
            to: address,
            data: "0x" as `0x${string}`,
            value: BigInt(0),
         },
      ]
      : [], [address]);

   const sendNotification = useNotification();

   const handleSuccess = useCallback(async (response: TransactionResponse) => {
      const transactionHash = response.transactionReceipts[0].transactionHash;

      console.log(`Transaction successful: ${transactionHash}`);

      await sendNotification({
         title: "Congratulations!",
         body: `You sent your a transaction, ${transactionHash}!`,
      });
   }, [sendNotification]);

   return (
      <Card title="Make Your First Transaction">
         <div className="space-y-4">
            <p className="text-[var(--app-foreground-muted)] mb-4">
               Experience the power of seamless sponsored transactions with{" "}
               <a
                  href="https://onchainkit.xyz"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#0052FF] hover:underline"
               >
                  OnchainKit
               </a>
               .
            </p>

            <div className="flex flex-col items-center">
               {address ? (
                  <Transaction
                     calls={calls}
                     onSuccess={handleSuccess}
                     onError={(error: TransactionError) =>
                        console.error("Transaction failed:", error)
                     }
                  >
                     <TransactionButton className="text-white text-md" />
                     <TransactionStatus>
                        <TransactionStatusAction />
                        <TransactionStatusLabel />
                     </TransactionStatus>
                     <TransactionToast className="mb-4">
                        <TransactionToastIcon />
                        <TransactionToastLabel />
                        <TransactionToastAction />
                     </TransactionToast>
                  </Transaction>
               ) : (
                  <p className="text-yellow-400 text-sm text-center mt-2">
                     Connect your wallet to send a transaction
                  </p>
               )}
            </div>
         </div>
      </Card>
   );
}
