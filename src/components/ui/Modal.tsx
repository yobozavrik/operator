'use client';

import React, { useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    children: React.ReactNode;
    /** Modal size variant */
    size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
    /** Custom max-width override */
    maxWidth?: string;
    /** Show close button in header */
    showCloseButton?: boolean;
    /** Close on backdrop click */
    closeOnBackdrop?: boolean;
    /** Close on Escape key */
    closeOnEscape?: boolean;
    /** Additional className for modal container */
    className?: string;
    /** Z-index level */
    zIndex?: number;
}

const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-xl',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    full: 'max-w-[95vw]',
};

// Backdrop animation
const backdropVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { duration: 0.2, ease: 'easeOut' as const }
    },
    exit: {
        opacity: 0,
        transition: { duration: 0.15, ease: 'easeIn' as const }
    }
};

// Modal animation
const modalVariants = {
    hidden: {
        opacity: 0,
        scale: 0.95,
        y: 10,
    },
    visible: {
        opacity: 1,
        scale: 1,
        y: 0,
        transition: {
            duration: 0.25,
            ease: [0.16, 1, 0.3, 1] as [number, number, number, number],
            delay: 0.05
        }
    },
    exit: {
        opacity: 0,
        scale: 0.97,
        y: 5,
        transition: {
            duration: 0.15,
            ease: 'easeIn' as const
        }
    }
};

export const Modal = ({
    isOpen,
    onClose,
    children,
    size = 'lg',
    maxWidth,
    showCloseButton = true,
    closeOnBackdrop = true,
    closeOnEscape = true,
    className,
    zIndex = 100,
}: ModalProps) => {
    const modalRef = useRef<HTMLDivElement>(null);

    // Handle Escape key
    const handleEscape = useCallback((e: KeyboardEvent) => {
        if (e.key === 'Escape' && closeOnEscape) {
            onClose();
        }
    }, [onClose, closeOnEscape]);

    // Body scroll lock
    useEffect(() => {
        if (isOpen) {
            const originalOverflow = document.body.style.overflow;
            const originalPaddingRight = document.body.style.paddingRight;

            // Calculate scrollbar width to prevent layout shift
            const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;

            document.body.style.overflow = 'hidden';
            document.body.style.paddingRight = `${scrollbarWidth}px`;

            return () => {
                document.body.style.overflow = originalOverflow;
                document.body.style.paddingRight = originalPaddingRight;
            };
        }
    }, [isOpen]);

    // Escape key listener
    useEffect(() => {
        if (isOpen) {
            document.addEventListener('keydown', handleEscape);
            return () => document.removeEventListener('keydown', handleEscape);
        }
    }, [isOpen, handleEscape]);

    // Focus trap - focus modal when opened
    useEffect(() => {
        if (isOpen && modalRef.current) {
            const focusableElements = modalRef.current.querySelectorAll(
                'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
            );
            const firstElement = focusableElements[0] as HTMLElement;
            firstElement?.focus();
        }
    }, [isOpen]);

    // Handle backdrop click
    const handleBackdropClick = (e: React.MouseEvent) => {
        if (e.target === e.currentTarget && closeOnBackdrop) {
            onClose();
        }
    };

    return (
        <AnimatePresence mode="wait">
            {isOpen && (
                <motion.div
                    className="fixed inset-0 flex items-center justify-center p-4"
                    style={{ zIndex }}
                    variants={backdropVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    onClick={handleBackdropClick}
                >
                    {/* Backdrop with blur */}
                    <div
                        className="absolute inset-0 bg-black/85 backdrop-blur-xl"
                        style={{
                            background: 'radial-gradient(ellipse at center, rgba(10, 25, 49, 0.95) 0%, rgba(0, 0, 0, 0.95) 100%)',
                        }}
                    />

                    {/* Subtle gradient overlay */}
                    <div
                        className="absolute inset-0 pointer-events-none opacity-30"
                        style={{
                            background: 'radial-gradient(circle at 30% 20%, rgba(0, 212, 255, 0.1) 0%, transparent 40%), radial-gradient(circle at 70% 80%, rgba(0, 136, 255, 0.08) 0%, transparent 40%)',
                        }}
                    />

                    {/* Modal container */}
                    <motion.div
                        ref={modalRef}
                        className={cn(
                            'relative w-full flex flex-col overflow-hidden',
                            'bg-[#0D1117] border border-white/10 rounded-2xl',
                            'shadow-[0_0_0_1px_rgba(255,255,255,0.05),0_25px_50px_-12px_rgba(0,0,0,0.8),0_0_100px_-20px_rgba(0,136,255,0.15)]',
                            'max-h-[90vh]',
                            maxWidth || sizeClasses[size],
                            className
                        )}
                        variants={modalVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Animated top border glow */}
                        <div
                            className="absolute top-0 left-0 right-0 h-[1px] overflow-hidden"
                            style={{
                                background: 'linear-gradient(90deg, transparent, rgba(0, 212, 255, 0.5), rgba(0, 136, 255, 0.5), transparent)',
                            }}
                        />

                        {children}

                        {/* Floating close button (optional) */}
                        {showCloseButton && (
                            <button
                                onClick={onClose}
                                className={cn(
                                    'absolute top-4 right-4 z-10',
                                    'p-2 rounded-xl',
                                    'bg-white/5 hover:bg-white/10',
                                    'text-white/40 hover:text-white',
                                    'border border-white/5 hover:border-white/20',
                                    'transition-all duration-200',
                                    'focus:outline-none focus:ring-2 focus:ring-[#00D4FF]/50'
                                )}
                                aria-label="Close modal"
                            >
                                <X size={18} />
                            </button>
                        )}
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

// ===== Subcomponents for structured modal content =====

export interface ModalHeaderProps {
    children: React.ReactNode;
    icon?: React.ReactNode;
    className?: string;
}

export const ModalHeader = ({ children, icon, className }: ModalHeaderProps) => (
    <div className={cn(
        'flex-shrink-0 px-6 py-5 border-b border-white/5',
        'bg-gradient-to-r from-[#0D1117] to-[#111823]',
        className
    )}>
        <div className="flex items-center gap-3 pr-10">
            {icon && (
                <div className="w-10 h-10 rounded-xl bg-[#00D4FF]/10 flex items-center justify-center text-[#00D4FF]">
                    {icon}
                </div>
            )}
            <div className="flex-1">
                {children}
            </div>
        </div>
    </div>
);

export interface ModalBodyProps {
    children: React.ReactNode;
    className?: string;
    noPadding?: boolean;
}

export const ModalBody = ({ children, className, noPadding }: ModalBodyProps) => (
    <div className={cn(
        'flex-1 overflow-y-auto custom-scrollbar',
        'bg-[#0D1117]',
        !noPadding && 'p-6',
        className
    )}>
        {children}
    </div>
);

export interface ModalFooterProps {
    children: React.ReactNode;
    className?: string;
}

export const ModalFooter = ({ children, className }: ModalFooterProps) => (
    <div className={cn(
        'flex-shrink-0 px-6 py-4 border-t border-white/5',
        'bg-gradient-to-r from-[#111823] to-[#0D1117]',
        className
    )}>
        {children}
    </div>
);

// ===== Preset Buttons =====

export interface ModalButtonProps {
    children: React.ReactNode;
    onClick?: () => void;
    variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
    disabled?: boolean;
    loading?: boolean;
    icon?: React.ReactNode;
    className?: string;
    type?: 'button' | 'submit';
}

export const ModalButton = ({
    children,
    onClick,
    variant = 'primary',
    disabled,
    loading,
    icon,
    className,
    type = 'button',
}: ModalButtonProps) => {
    const baseClasses = cn(
        'flex items-center justify-center gap-2',
        'px-6 py-2.5 rounded-xl',
        'text-[13px] font-bold uppercase tracking-wider',
        'transition-all duration-200',
        'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#0D1117]',
        disabled && 'opacity-50 cursor-not-allowed',
    );

    const variantClasses = {
        primary: cn(
            'bg-gradient-to-r from-[#0088FF] to-[#00D4FF]',
            'text-white',
            'shadow-lg shadow-[#0088FF]/20',
            'hover:shadow-xl hover:shadow-[#00D4FF]/30',
            'hover:scale-[1.02] active:scale-[0.98]',
            'focus:ring-[#00D4FF]'
        ),
        secondary: cn(
            'bg-white/5 border border-white/10',
            'text-white/80 hover:text-white',
            'hover:bg-white/10 hover:border-white/20',
            'focus:ring-white/30'
        ),
        ghost: cn(
            'text-white/60 hover:text-white',
            'hover:bg-white/5',
            'focus:ring-white/20'
        ),
        danger: cn(
            'bg-gradient-to-r from-[#EF4444] to-[#F87171]',
            'text-white',
            'shadow-lg shadow-[#EF4444]/20',
            'hover:shadow-xl hover:shadow-[#EF4444]/30',
            'hover:scale-[1.02] active:scale-[0.98]',
            'focus:ring-[#EF4444]'
        ),
    };

    return (
        <button
            type={type}
            onClick={onClick}
            disabled={disabled || loading}
            className={cn(baseClasses, variantClasses[variant], className)}
        >
            {loading ? (
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
            ) : icon}
            {children}
        </button>
    );
};

export default Modal;
