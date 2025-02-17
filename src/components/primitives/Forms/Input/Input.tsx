import React, { InputHTMLAttributes, useRef } from 'react';
import styled from 'styled-components';
import { FormElementProps } from 'components/primitives/Forms/types';

const UnstyledInput = styled.input<InputHTMLAttributes<HTMLInputElement>>`
  border: none;
  background: none;
  background-color: transparent;
  box-shadow: none;
  width: 100%;
  box-sizing: border-box;
  outline: none;
`;

const InputWrapper = styled.div<{
  isInvalid?: boolean;
  textAlign?: string;
  muted?: boolean;
  disabled?: boolean;
}>`
  display: flex;
  align-items: center;
  box-sizing: border-box;
  width: 100%;

  border: 1px solid
    ${({ theme, isInvalid }) =>
      isInvalid ? theme.colors.red : theme.colors.border1};
  border-radius: 1.5rem;
  padding: 0.5rem 0.8rem;
  background-color: transparent;

  input {
    color: ${({ theme, isInvalid, muted, disabled }) => {
      if (isInvalid) return theme.colors.red;
      if (muted) return theme.colors.border1;
      if (disabled) return theme.colors.grey;
      return theme.colors.text;
    }};
    font-family: ${({ theme }) => theme.fonts.body};
    font-size: ${({ theme }) => theme.fontSizes.body};
    font-weight: ${({ theme }) => theme.fontWeights.regular};
    text-align: ${({ textAlign }) => textAlign || 'left'};

    &::placeholder {
      color: ${({ theme }) => theme.colors.grey};
    }
  }

  :hover {
    outline: 1px solid
      ${({ theme, isInvalid, disabled }) =>
        isInvalid
          ? theme.colors.red
          : disabled
          ? 'inherit'
          : theme.colors.text};
  }

  :focus {
    outline: 2px solid
      ${({ theme, isInvalid }) =>
        isInvalid ? theme.colors.red : theme.colors.text};
  }
`;

const IconContainer = styled.div<{ right?: boolean }>`
  margin-${({ right }) => (right ? 'left' : 'right')}: 0.3rem;
`;

export interface InputProps<T>
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'>,
    FormElementProps<T> {
  icon?: React.ReactElement;
  iconRight?: React.ReactElement;
  isInvalid?: boolean;
  textAlign?: string;
  muted?: boolean;
}

export const Input: React.FC<InputProps<any>> = ({
  icon = null,
  iconRight = null,
  isInvalid,
  textAlign,
  muted,
  disabled,
  ...rest
}) => {
  const inputRef = useRef(null);

  const handleClick = () => {
    inputRef.current.focus();
  };

  const handleDoubleClick = () => {
    inputRef.current.select();
  };

  return (
    <InputWrapper
      disabled={disabled}
      textAlign={textAlign}
      isInvalid={isInvalid}
      muted={muted}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
    >
      <IconContainer>{icon}</IconContainer>
      <UnstyledInput ref={inputRef} disabled={disabled} {...rest} />
      <IconContainer right>{iconRight}</IconContainer>
    </InputWrapper>
  );
};
