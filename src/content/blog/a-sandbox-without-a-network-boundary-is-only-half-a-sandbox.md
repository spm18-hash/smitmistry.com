---
title: A sandbox without a network boundary is only half a sandbox
description: This is description
pubDate: 2026-08-17
---

Running untrusted code safely requires more than separating it from the host. You also have to control what that code can reach.

This matters more as AI agents gain the ability to read files, execute commands, install packages, and generate programs of their own. A microVM can prevent that code from accessing the host or another workload. By itself, it cannot stop the code from exfiltrating data, probing internal services, attacking systems elsewhere on the internet, or using credentials available inside the environment.

Isolation without egress control contains the process, not its consequences.

A complete sandbox therefore needs both compute isolation and control over the authority available through its network: where code can connect, which credentials it can use, and how those permissions change throughout the workload’s lifecycle. These controls are part of the security boundary, not protections to bolt on later.

## A sandbox has more than one boundary

Compute isolation answers one important question: what can this program access on the machine where it runs? Network isolation answers another: what can it access, or attack, through the network?

Consider an agent that reads a repository and runs generated code. A prompt injection hidden in an issue, log entry, dependency, or source file might instruct it to upload private data. The generated program does not need to escape its microVM. With unrestricted outbound traffic, it can simply send anything it can read to an external server.

The same access can be used to scan internal networks, exfiltrate data and credentials, or call an authenticated API. From the attacker’s perspective, crossing the VM boundary may be unnecessary. Without a network boundary, it is only half a sandbox.

## A network bypass can be a sandbox escape

Recent security research has made one pattern clear: untrusted code does not need to cross a VM boundary to escape containment. It only needs one network path that the security model failed to account for.

That path might be a DNS resolver left available in an otherwise disconnected environment, an empty allowlist that fails open, a hostname interpreted differently by a policy engine and a proxy, or a trusted package service turned into a relay. Any one of them can give untrusted code a channel to exfiltrate data, receive instructions, or move toward more sensitive infrastructure.

These are not compute escapes. The kernel, VM, or container boundary may continue working exactly as designed while containment still fails. The practical security boundary also includes DNS, proxies, identity services, internal networks, and every intentionally permitted destination.

Whether we call the result an escape or a bypass, the requirement is the same: a sandbox must account for every path by which untrusted code can communicate.
